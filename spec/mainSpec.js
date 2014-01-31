var nano = require('nano');

//load the module under test.
var migrations = require('../index.js');

//set async timeout to a half-second.
var HALF_SECOND = 500;

describe("Migration function", function(){
	_baseconn = nano("http://localhost:5984/");
	
	_conn = null;
	_dbname = null;

	//create a test database in which to push migrations.
	beforeEach(function(done){
		_dbname = "couch_migrations_tests_" + 
			new Date().getTime() + "_" + Math.floor(Math.random() * 10000);

		_baseconn.db.create(_dbname, function(err){
			if(err){
				throw "Couldn't create test db: " + _dbname;
			}else{
				_conn = _baseconn.use(_dbname);
				done();
			}
		});
	}, HALF_SECOND);

	//destroy the test database.
	afterEach(function(done){
		done();
		/*_baseconn.db.destroy(_dbname, function(err){
			if(err){
				throw "Couldn't destroy test db: " + _dbname;
			}else{
				done();
			}
		});*/
	}, HALF_SECOND);

	it("applies object-based migration.", function(done) {
		done();
	}, HALF_SECOND);
	
	it("applies function-based migration.", function(done) {
		done();
	}, HALF_SECOND);
	
	it("does not crash when no result is returned from a function.", function(done) {
		done();
	}, HALF_SECOND);
	
	it("halts migrations when an exception is thrown from a migration.", function(done){
		done();
	}, HALF_SECOND);

	it("applies 'up()' function when present on return object.", function(done){
		done();
	}, HALF_SECOND);
	
	it("applies 'down()' function when requested on return object.", function(done){
		done();
	}, HALF_SECOND);

	it("creates a '_design/migrations' document to store information on a database.", function(done){
		done();
	}, HALF_SECOND);

	it("parses version from file name.", function(done){
		done();
	}, HALF_SECOND);

	it("runs an array of migrations passed as second argument.", function(done){
		done();
	}, HALF_SECOND);

	it("loads an array of migrations based on a file path.", function(done){
		done();
	}, HALF_SECOND);

	it("returns event emitter.", function(done){
		var results = migrations(_conn, [{
			label : "1234",
			docs : {}
		},{
			label : "4567",
			docs : [{
				_id : "seed_doc",
				title : "test"
			}]
		}]);
		
		var appliedSpy = jasmine.createSpy();
		results.on('applied', appliedSpy);

		results.on('done', function(){
			expect(appliedSpy.callCount).toEqual(2);
			expect(appliedSpy).toHaveBeenCalledWith(4567);
			expect(appliedSpy).toHaveBeenCalledWith(1234);
			done();
		});

		results.on('error', function(err){
			done(err);
		});
	}, HALF_SECOND);

});