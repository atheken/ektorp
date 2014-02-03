(function(){
	"use strict";

	var APPLIED_EVENT = 'applied';
	var SKIP_EVENT = 'applied_previously';
	var DONE_EVENT = 'done';
	var ERROR_EVENT = 'error';

	var EventEmitter = require('events').EventEmitter;
	var isFunction = function(o){return o !== null && Object.prototype.toString.call(o) === '[object Function]';};
	var isArray = function(o){return o !== null && Object.prototype.toString.call(o) === "[object Array]";};
	var isObject = function(o){return o !== null && Object.prototype.toString.call(o) === "[object Object]";};
	var isString = function(o){return o !== null && Object.prototype.toString.call(o) === "[object String]";};

	var configureMigrations = function(migrations){
		
		var retval = migrations;

		//write a design doc that contains migrations:
		if(isString(migrations)){
			var fs = require('fs');
			var dir = migrations;
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
		for(var counter = 0; counter < retval.length; counter++){
			retval[counter].label = parseFloat(retval[counter].label);
		}

		//sort the migrations least to greatest by parsed version.
		retval = retval.sort(function(a,b){
			return a.label >= b.label;
		});

		return retval;
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

			db.bulk({ docs : bulk }, null, function(err, bulk_insert_result){
				if(err){
					emitter.emit(ERROR_EVENT, err);
				}			
				else{
					emitter.emit(APPLIED_EVENT, migration.label);
				}
			});
		}
	};

	var applyMigrations = function(db, migrations, emitter){
		if(migrations.length > 0){
			var migration = migrations.shift();
			db.get('_design/applied_migrations', {include_docs : true}, function(err, result){


				var current = { 
					_id : '_design/applied_migrations',
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
								docs = docs(db);
							}

							push(db, migration, bulk, docs, emitter);
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

		if(isString(db)){
			db = require('nano')(db);
		}

		var emitter = new EventEmitter();
		
		var continueProcessing = true;
		
		var next = function(){
			if(continueProcessing){
				if(migrations.length === 0){
					//allow the current in-flight events to complete, first.
					process.nextTick(function(){emitter.emit('done');});
				}else{
					applyMigrations(db, migrations, emitter);
				}
			}
		};

		emitter.on(ERROR_EVENT, function(){continueProcessing = false;})
				.on(APPLIED_EVENT, next)
				.on(SKIP_EVENT, next);

		emitter.start = function(){
			try{
				migrations = configureMigrations(migrations);
				next();
			}catch(ex){
				emitter.emit('error', ex);
			}
		};

		return emitter;
	};
})();