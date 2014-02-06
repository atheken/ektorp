(function(){
	"use strict";

	var APPLIED_EVENT = 'applied';
	var SKIP_EVENT = 'skipped';
	var DONE_EVENT = 'done';
	var ERROR_EVENT = 'error';
	var MIGRATIONS_DOC = '_design/applied_migrations';

	var EventEmitter = require('events').EventEmitter;
	var _ = require('underscore');

	var isFunction = function(o){return o !== null && Object.prototype.toString.call(o) === '[object Function]';};
	var isArray = function(o){return o !== null && Object.prototype.toString.call(o) === "[object Array]";};
	var isObject = function(o){return o !== null && Object.prototype.toString.call(o) === "[object Object]";};
	var isString = function(o){return o !== null && Object.prototype.toString.call(o) === "[object String]";};

	var configureMigrations = function(migrations){
		
		var retval = migrations;

		//write a design doc that contains migrations:
		if(isString(retval)){
			var fs = require('fs');
			var dir = retval;
			retval = []; //redefine
			//foreach migration found, run it, and then the next.

			var fileMigrations = fs.readdirSync(dir).sort();

			for(var i = 0; i < fileMigrations.length; i++){
				var filename = fileMigrations[i];
				var mig = require(dir + '/' + filename);

				//is this an object or a function?
				if(isObject(mig)){
					//check for "_id"...
					if(mig._id){
						mig = { docs : [mig] };
					}
				}
				else if(isArray(mig)){
					mig = {docs : mig};
				}
				else if(isFunction(mig)){
					mig = { docs : mig };
				}else{
					throw "Only objects and functions are supported for migrations, " + filename + 
							" appears to produce another value.";
				}
				mig.name = mig.name || filename;
				mig.label = mig.label || filename.match(/^[0-9]+/)[0];


				retval.push(mig);

			}
		}

		if(isObject(retval)){
			retval = [retval];			
		}

		//labels should be numeric. This allows more reliable sorting.
		_.each(retval, function(mig){ mig.label = parseFloat(mig.label);});
		
		//sort the migrations least to greatest by parsed version.
		retval = retval.sort(function(a,b){
			return a.label >= b.label;
		});

		//de-reference the original array, into a new one, this is going to get modified..
		return [].concat(retval);
	};

	var push = function(db, migration, bulk, docs, emitter){
		if(docs === null){
			emitter.emit(ERROR_EVENT, new Error('Migrations must provide an array of docs, an object, '+
							'or function that produces an array or object.'));
		}
		else{
			if(isObject(docs)){
				bulk = bulk.concat([docs]);
			}else if(isArray(docs)){
				bulk = bulk.concat(docs);
			}

			var ids = _.chain(bulk).filter(function(d){return d._id;})
						.map(function(d){return d._id;}).value();
			
			db.list({keys : ids, include_docs : true }, function(err, list_result){
				
				if(err){
					emitter.emit(ERROR_EVENT, err);
				}
				else{
					var revs = {};
					
					//pluck the the revs from the db. 
					_.each(list_result.rows, function(d){
						if(d.doc && d.doc._id !== MIGRATIONS_DOC){
							revs[d.doc._id] = d.doc._rev;
						}
					});
					
					//apply the revs to the document.
					_.each(bulk, function(d){
						if(revs[d._id]){
							d._rev = revs[d._id];
						}
					});

					db.bulk({ docs : bulk }, null, function(err, bulk_insert_result){
						if(err){
							emitter.emit(ERROR_EVENT, err);
						}			
						else{
							emitter.emit(APPLIED_EVENT, migration.label);
						}
					});
				}
			});
		}
	};

	var applyMigrations = function(db, migrations, emitter){
		if(migrations.length > 0){
			var migration = migrations.shift();
			db.get(MIGRATIONS_DOC, {include_docs : true, stale_ok : 'update'}, function(err, result){
				var current = { 
					_id : MIGRATIONS_DOC,
					applied_migrations : []
				};

				if(err && err.reason !== 'missing'){
					emitter.emit(ERROR_EVENT, err);
				}
				else{
					try{
						result = result || current;
						var already_applied = false;

						for(var i = 0; i < result.applied_migrations.length; i++){
							var entry = result.applied_migrations[i];
							if(entry.label === migration.label){
								already_applied = true;
								break;
							}
						}

						if(!already_applied){

							result.applied_migrations.push({label : migration.label, date_applied : new Date().toString()});
							
							var bulk = [result];
							
							var docs = migration.docs;
							if(isFunction(docs)){
								//call the function, providing the db.. 
								//perhaps this should be structured to run async.
								
								if(docs.length <= 1){
									var d = docs(db);
									push(db, migration, bulk, d, emitter);
								}
								else if(docs.length === 2){
									docs(db, function(err, d){
										if(err){
											emitter.emit('error', err);
										}else{
											push(db, migration, bulk, d, emitter);	
										}
									});
								}
							}
							else{
								push(db, migration, bulk, docs, emitter);
							}
						}
						else{
							emitter.emit(SKIP_EVENT, migration.label);
						}
					}catch(ex){
						emitter.emit(ERROR_EVENT, ex);
					}
				}
			});
		}
	};


	module.exports = function(db, migrations, version){
		
		var emitter = new EventEmitter();
		var migs = migrations;


		var continueProcessing = true;
		
		var next = function(){
			if(continueProcessing){
				if(migs.length === 0){
					//allow the current in-flight events to complete, first.
					process.nextTick(function(){emitter.emit('done');});
				}else{
					applyMigrations(db, migs, emitter);
				}
			}
		};

		emitter.on(ERROR_EVENT, function(){continueProcessing = false;})
				.on(APPLIED_EVENT, next)
				.on(SKIP_EVENT, next);

		emitter.start = function(){
			try{
				migs = configureMigrations(migs);

				if(isString(db)){
					var nano = require('nano');
					db = nano(db);
					var server = nano(db.config.url);
					server.db.list(function(err, list){
						if(!err){
							var exists = _.find(list, function(d){ return db.config.db == d;});
							if(!exists){
								server.db.create(db.config.db, function(err){
									if(err){
										emitter.emit('error', err);
									}
									else{
										next();
									}
								});
							}else{
								next();
							}
						}else{
							emitter.emit('error', err);
						}
					});
				}
				else{
					next();
				}
			}catch(ex){
				emitter.emit('error', ex);
			}
		};

		return emitter;
	};
})();