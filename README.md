simple-node-db
==============

a database implementation on top of levelup, leveldown, and memdown...

# API

## constructor

	var SimpleDb = require('simple-node-db');
	var db = new SimpleDb();
	
	// db will write to memory only
	
	db = new SimpleDb('/path/to/databse');
	
	// db will now write to the file system
	
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
	
## query( params, rowCallback, completeCallback )

	// query for a list rows where the key begins with 'mydomain:'
	var list = [];
	
	var rowCallback = function(data) {
		// put appropriate query conditions here 
		if ( data.key.indexOf('mydomain:') >= 0) ) {
			list.push( data.value );
		}
	};
	
	var params = {
		offset:50,
		limit:25
	};
	
	db.query(params, rowCallback, completeCallback);
	

## find( id, callback )

	// value is saved as a json object
	var callback = function(err, result) {
		if (err) throw err;
		
		var model = JSON.parse( result );
	};
	
	db.find(id, callback);
	
## insert 

	// id is created from uuid (without the dashes)
	db.insert( model, callback );


## update( model, callback )

	// probably best to prefix the id with a domain, in this case user; if the model has a 'lastUpdated'
	// attribute, then it will be updated to the current server date; if the model has a 'version' number
	// it will be bumped by one.
	var user = {
		id:'user:12345',
		dateCreated:new Date(),
		lastUpdated:new Date(),
		version:0,
		name:'Sam Sammyson',
		email:'sam@sammyson.com'
	};
	
	var callback = function(err, model) {
		if (err) throw err;
		
		assert model.version === user.version + 1;
		assert model.lastUpdated.getTime() > user.dateCreated.getTime();
	};
	
	// model must have an 'id' attribute
	db.update( model, callback );


## delete( id, callback )

	db.delete( id, callback );

## replicate( replicatePath, callback )

	// copy the current database to a replicate; use this to periodically backup an in-memory db or to
	// simply get a snap-shot of the current database
	db.replicate( replicateDbPath, callback );
	
## close( callback )

	db.close(function(err) {
		log.info('db is now closed...');
	});

## open( callback )

	db.open(function(err) {
		log.info('db is now open...');
	});

## isInMemory()
	
	if (db.isInMemory()) {
		log.info('database is in-memory, data will be lost if not backed up...');
	}
	