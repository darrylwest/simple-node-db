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
	
	// create db with options
	var options = {
		path:'/my/db/path',
		replication:{
			path:'/my/replication/db',
			interval:60000 * 5, // save after 5 minutes of inactivity,
			extention:'today' // replication name rolls daily
		},
		log:new Logger('db')
	};
	
	db = new SimpleDb( options );
	
## query

	var list = [];
	
	var rowCallback = function(data) {
		// put appropriate query conditions here 
		if ( data.key.indexOf('mydomain:') >= 0) ) {
			list.push( data.value );
		}
	};
	
	var options = {
		offset:50,
		limit:25
	};
	
	db.query(rowCallback, completeCallback [, options ]);
	

## find

	// value is saved as a json object
	var callback = function(err, result) {
		if (err) throw err;
		
		var model = JSON.parse( result );
	};
	
	db.find(id, callback);

## update

	// model must have an 'id' attribute
	db.update( model, callback );

## insert 

	// id is created from uuid (without the dashes)
	db.insert( model, callback );

## delete

	db.delete( id, callback );

## replicate

	// copy the current database to a replicate
	db.replicate( replicateDbPath, callback );
	
