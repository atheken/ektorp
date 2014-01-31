(function(){
	var EventEmitter = require('events').EventEmitter;

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
				if(Object.prototype.toString.call(mig) === "[object Object]"){
					//check for "_id"...
					if(mig._id){
						mig = { docs : [mig] };
					}
				}
				else if(Object.prototype.toString.call(mig) === "[object Array]"){
					mig = {docs : mig};
				}
				else if(Object.prototype.toString.call(mig) === "[object Function]"){
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
			}else{
				//push the label, and the doc to the server, together.

				next(null,migration.label);
				//var applied_migrations = { migrations : [] }
			}
		});
	};

	var migrate = function(db, migrations, emitter){
		if(migrations.length > 0){
			var migration = migrations.shift();
			applyMigration(db, migration, function(err, result){
				if(err){
					emitter.emit('error', err);
				}else{
					emitter.emit('applied', result);
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