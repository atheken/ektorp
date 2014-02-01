#!/usr/bin/env node
//Get everything, BUT the command used to invoke this script.
var args = process.argv.slice(1);
var ektorp = require('./index.js');

if(args.length < 3){
	console.log('Usage: ektorp database_uri migration_directory [migration_limit]');
}
else{
	console.info('Migrating couchdb ' + new Date());
	var emitter = ektorp(args[0], args[1],args[2]);

	emiiter.on('applied', function(label){
		console.info('Applied migration: ' + label);
	});

	emiiter.on('error', function(error){
		console.error('Error: ' + error);
		process.exit(1);
	});

	emiiter.on('done', function(){
		console.info('Migrations completed, successfuly!');
		process.exit();
	});
}