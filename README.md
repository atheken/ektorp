## Ektorp
### Some assembly required.

_Ektorp is a node.js library and command-line utility for building your CouchDB._

#### Project Status

_Ektorp is incomplete but we have a number of tests, and most of them are passing. :-)_

[![Build Status](https://travis-ci.org/atheken/ektorp.png?branch=master)](https://travis-ci.org/atheken/ektorp)

#### Using Ektorp

##### From the command-line:

1. Install ektorp globally:

	`$ npm install -g ektorp`

2. Run ektorp:

	`$ ektorp http://localhost:5984/new_db ./migrations`

3. Relax!


##### From your own code:

To integrate ektorp and control more aspects of the migration:

1. Install ektorp (doesn't need to be installed globally if you don't want to use the CLI tool):

	`$ npm install ektorp`

2. Leverage ektorp in your own bootstrap script:

	```
	var ektorp = require('ektorp');

	//pass the url to the DB you want to upgrade, and the path to migrations:
	var migrator = ektorp('http://localhost:5984/new_db', './migrations');

	migrator.on('done', function(){ console.log('Migrations are done!'); });

	//cause the migrator to start.
	migrator.start();
	```

#### How do I write a migration?

Here's one way that is supported (there are others that will be documented soon):

1. Create a directory:

	`$ mkdir ./migrations`

2. Make a migration:

	```
	$ cd ./migrations
	$ touch 201401310849_first_migration.json
	```

3. You can put a JSON array or object in `201401310849_first_migration.json`, it will be pushed to the database when you run `ektorp`.
