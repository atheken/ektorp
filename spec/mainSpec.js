var nano = require('nano');

//load the module under test.
var ektorp = require('../lib/index.js');

//set async timeout to a half-second.
var HALF_SECOND = 500;

describe("Migration function", function(){
	_baseconn = nano("http://localhost:5984/");
	_dbname = null;
	_conn = null;

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
		_baseconn.db.destroy(_dbname, function(err){
			if(err){
				throw "Couldn't destroy test db: " + _dbname;
			}else{
				done();
			}
		});
	}, HALF_SECOND);


	xit("applies object-based migration.", function(done) {
		done();
	}, HALF_SECOND);
	
	xit("applies function-based migration.", function(done) {
		done();
	}, HALF_SECOND);
	
	xit("does not crash when no result is returned from a function.", function(done) {
		done();
	}, HALF_SECOND);
	
	xit("halts migrations when an exception is thrown from a migration.", function(done){
		done();
	}, HALF_SECOND);

	xit("applies 'up()' function when present on return object.", function(done){
		done();
	}, HALF_SECOND);
	
	xit("applies 'down()' function when requested on return object.", function(done){
		done();
	}, HALF_SECOND);

	it("creates a '_design/migrations' document to store information on a database.", function(done){

		var migrator = ektorp(_conn, [{label: "1", docs : []},{ label: 2, docs : []}]);

		migrator.on('done', function(){
			_conn.get('_design/migrations',{include_docs : true}, function(err,result){
				expect(result).not.toBeNull();
				expect(result.applied_migrations.length).toEqual(2);
				done();
			});
		});
		
		done();
	}, HALF_SECOND);


	it("parses version from file name.", function(done){

		var versions = [201401261512,201401261513];
		var migrator = ektorp(_conn, __dirname + '/testMigrations');
		
		migrator.on('applied', function(label){
					expect(label).toEqual(versions.shift());
				})
				.on('done', function(){
					done();
				});

		migrator.start();

	}, HALF_SECOND);

	it("loads an array of migrations based on a file path.", function(done){
		var appliedSpy = jasmine.createSpy();
		var migrator = ektorp(_conn, __dirname + '/testMigrations');

		migrator.on('applied',appliedSpy)
				.on('done', function(){
					expect(appliedSpy.callCount).toEqual(2);
					done();
				});

		migrator.start();
	}, HALF_SECOND);

	it("runs an array of migrations passed as second argument.", function(done){
		var appliedSpy = jasmine.createSpy();

		var migrator = ektorp(_conn, [{label: "1", docs : []},{ label: 2, docs : []}]);

		migrator.on('applied',appliedSpy)
				.on('done', function(){
					expect(appliedSpy.callCount).toEqual(2);
					done();
			});

		done();
	}, HALF_SECOND);

	it("returns event emitter.", function(){
		var migrator = ektorp(_conn, []);
		var EventEmitter = require('events').EventEmitter;
		expect(migrator instanceof EventEmitter).toBe(true);
	});

});