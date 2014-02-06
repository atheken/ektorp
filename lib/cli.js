#!/usr/bin/env node
//Get everything, BUT the command used to invoke this script.
"use strict";
var args = process.argv.slice(2);
var ektorp = require('./index.js');

if(args.length < 2){
	console.log('Usage: ektorp database_uri migration_directory');
}
else{
	console.info('Migrating CouchDB ' + new Date());
	
	var emitter = ektorp(args[0], args[1]);

	emitter.on('applied', function(label){
		console.info('Applied migration: ' + label);
	})
	.on('skipped', function(label){
		console.info('Skipped migration: ' + label);
	})
	.on('error', function(error){
		console.error('Error: ' + error);
		process.exit(1);
	}).on('done', function(){
		console.info('Migrations completed, successfuly!');
		process.exit();
	});
	
	//GO!
	emitter.start();
}