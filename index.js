(function(){
	module.exports = function(db, migrationsPath, version){
		var fs = require('fs');

		//write a design doc that contains migrations:


		//foreach migration found, run it, and then the next.
		var migrations = fs.readdirSync(migrationsPath).sort();
		
	}
})();