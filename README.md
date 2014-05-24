simple-node-db
==============

a database implementation on top of levelup, leveldown, and memdown...

# API

## constructor

	var SimpleDb = require('simple-node-db');
	var db = new SimpleDb();
	
	// db is now in memory-mode
	
	db = new SimpleDb('/path/to/databse');
	
	// db is now writing to the file system
	
## query

	var list = [];
	
	var rowCallback = function(data) {
		// put appropriate query conditions here 
		if ( data.key.indexOf('mydomain:') >= 0) ) {
			list.push( data.value );
		}
	};
	
	var completeCallback = function(err, results) {
		
	};
	
	db.query(rowCallback, completeCallback [, options ]);
	

## find

## update

## insert 

## delete

## replicate
