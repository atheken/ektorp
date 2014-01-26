var nano = require('nano');

//load the module under test.
var migrations = require('../index.js');

//set async timeout to a half-second.
var HALF_SECOND = 500;

xdescribe("Migration function", function(){
	_couchConnection = null;
	beforeEach(function(done){
		done();
	}, HALF_SECOND);

	afterEach(function(done){
		done();
	}, HALF_SECOND);

	it("applies migration that returns an object.", function(done) {
		done();
	}, HALF_SECOND);
	
	it("applies migration that returns a function.", function(done) {
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

	it("returns results of running migrations.", function(done){
		done();
	}, HALF_SECOND);

});