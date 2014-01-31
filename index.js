(function(){
	"use strict"

	var EventEmitter = require('events').EventEmitter;
	var isFunction = function(o){return o !== null && Object.prototype.toString.call(o) === '[object Function]';};
	var isArray = function(o){return o !== null && Object.prototype.toString.call(o) === "[object Array]";};
	var isObject = function(o){return o !== null && Object.prototype.toString.call(o) === "[object Object]";};

	var configureMigrations = function(migrations){
		var retval = migrations;

		//write a design doc that contains migrations:
		if(Object.prototype.toString.call(migrations) === "[object String]"){
			var fs = require('fs');
			retval = []; //redefine
			//foreach migration found, run it, and then the next.
			var migrations = fs.readdirSync(migrations).sort();
			for(var i = 0; i < migrations.length; i++){
				var filename = migrations[i]
				var mig = require(migrations + '/' + filename);

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
					throw "Only objects and functions are supported for migrations, " 
						+ migrations[i] + " appears to produce another value.";
				}
				mig.name = mig.name || filename;
				mig.label = mig.label || filename.match(/^[0-9]+/)[0];
				retval.push(mig);
			}
		}

		//labels should be numeric. This allows more reliable sorting.
		for(var i = 0; i < retval.length; i++){
			retval[i].label = parseFloat(retval[i].label);
		}

		//sort the migrations least to greatest by parsed version.
		retval = retval.sort(function(a,b){
			return a.label <= b.label;
		});

		return retval;
	}

	var applyMigration = function(db, migration, next){
		
		db.get('_design/applied_migrations', {include_docs : true}, function(err, result){
			var current = { 
				_id : '_design/applied_migrations',
				applied_migrations : []
			};


			if(err && err.reason !== 'missing'){
				next(err);
			}
			else{
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
					if(isObject(docs)){
						bulk = bulk.concat([docs]);
					}else if(isArray(result)){
						bulk = bulk.concat(docs);
					}

					db.bulk({ docs : bulk }, null, function(err, bulk_insert_result){
						if(err){
							next(err);
						}			
						else{
							next(null, "applied", migration.label);
						}
					});
				}
				else{
					next(null, "applied_previously", migration.label);
				}
				//var applied_migrations = { migrations : [] }
			}
		});
	};

	var migrate = function(db, migrations, emitter){
		if(migrations.length > 0){
			var migration = migrations.shift();
			applyMigration(db, migration, function(err, result, label){
				if(err){
					emitter.emit('error', err);
				}else{
					emitter.emit(result, label);
					migrate(db, migrations, emitter);
				}
			});
		}else{
			emitter.emit('done');
		}
	};

	module.exports = function(db, migrations, version){
		
		migrations = configureMigrations(migrations);
		var retval = new EventEmitter();
		migrate(db, migrations, retval);
		return retval;
	}
})();