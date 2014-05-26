simple-node-db
==============

## Overview

A database implementation on top of levelup, leveldown, and memdown.  SimpleNodeDb leverages the document store aspects of level up to provide a data-model centric implementation.   

Models are stored as JSON strings with domain-scoped keys.  For example a user data model's key of '12345' would have an associated domain key of 'user:12345'.  So querying for users as opposed to orders or inventory parts is as easy as including records where keys begin with 'user:'.

Automatic model attributes include dateCreated, lastUpdated and version.  The version attribute is used to enforce optimistic locking.

Typically SimpleNodeDb is well suited for small to medium datasets (less than 100K rows) or data stores that don't require complex querying.  It also provides robust caching when used as an in-memory data store.  To support more than 100K rows you should probably create alternate indexing schemes or stick with redis, mongo, or a traditional SQL database.

## Testing And Examples

Basic testing is in place for all implemented methods (replicate is not implemented yet).  More robust testing and examples will come soon.

# API

## constructor

	// create an in-memory database
	var SimpleDb = require('simple-node-db');
	var db = new SimpleDb();
	
	// create a file based database
	db = new SimpleDb('/path/to/database');
	
	// create a database with options
	var options = {
		path:'/my/db/path',
		replication:{
			path:'/my/replication/db',
			interval:60000 * 5, // save after 5 minutes of inactivity,
			extension:'today' // replication name rolls daily
		},
		log:new Logger('db')
	};
	
	db = new SimpleDb( options );
	
## query( params, rowCallback, completeCallback )

	// query for a list rows where the key begins with 'my domain:'; limit the list to 25 rows
	
	var rowCallback = function(key, value) {
		// put appropriate query conditions here 
		if ( key.indexOf('mydomain:') >= 0) ) {
			// parse and return the value
			return JSON.parse( value );
		}
	};
	
	var completeCallback = function(err, list) {
		if (err) throw err;
		
		assert list.length === 25
	};
	
	var params = {
		offset:0,
		limit:25
	};
	
	db.query(params, rowCallback, completeCallback);
	

## find( key, callback )

	// create the key based on domain and model id
	var key = db.createDomainKey( 'user', id );
	
	// value is saved as a json object
	var callback = function(err, model) {
		if (err) throw err;
		
		// do something with the model...
	};
	
	db.find( key, callback );
	
## insert( key, model, callback )

	// a simple user model
	var user = {
		id:'12345',
		name:'Sam Sammyson',
		email:'sam@sammyson.com',
		status:'active'
	};
	
	// key is created for the 'user' domain
	var key = db.createDomainKey( 'user', user.id )
	
	var callback = function(err, model) {
		if (err) throw err;
		
		assert model.dateCreated;
		assert model.lastUpdated === model.dateCreated;
		assert model.version === 0;
	};
	
	// model must have an 'id' attribute
	db.insert( key, model, callback );


## update( key, model, callback )

	// the version and lastUpdated attributes are automatically updated	var user = {
		id:'12345',
		dateCreated:new Date(),
		lastUpdated:new Date(),
		version:0,
		name:'Sam Sammyson',
		email:'sam@sammyson.com',
		status:'active'
	};
	
	var key = db.createDomainKey( 'user', user.id )
	
	var callback = function(err, model) {
		if (err) throw err;
		
		assert model.version === user.version + 1;
		assert model.lastUpdated.getTime() > user.dateCreated.getTime();
	};
	
	// model must have an 'id' attribute
	db.update( key, model, callback );


## delete( key, callback )

	// very simple, merciless delete -- use at your own risk...
	var callback = function(err) {
		if (err) throw err;
	};
	
	db.delete( key, callback );
	
## createModelId()

	// create a model id from uuid without dashes
	var id = db.createModelId()
	
## createDomainKey( domain, id );

	var model = {
		id:db.createModelId()
	};
	
	var key = db.createDomainKey( 'user', model.id );
	
	assert key.contains( 'user' );
	assert key.contains( model.id );

	
## backup( filename, callback )

	// stream dump of keys and values row-by-row, CR/LF delimited
	var filename = '/path/to/backup/file';
	
	var callback = function(err, rowsWritten) {
		if (err) throw err;
		
		assert rowsWritten > 0;
	};
	
	db.backup( filename, callback );

## restore( filename, callback )

	// read the key/value file and batch put the rows; uses stream reader to 
	var callback = function(err, rowsRead) {
		if (err) throw err;
		
		assert rowsRead > 0;
	};
	
	var filename = '/path/to/my/backup';
	
	db.restore( filename, callback );
	
## stats( callback )

	var callback = function(err, stats) {
		if (err) throw err;
		
		console.log( stats.rowcount );
		console.log( stats.domains );
		console.log( stats.errors );
	};
	
	db.stats( callback );
	
## close( callback )

	db.close(function(err) {
		log.info('db is now closed...');
	});

## open( callback )

	db.open(function(err) {
		log.info('db is now open...');
		
		
	});

## replicate( config, callback )

	// copy the current database to a replica; use this to periodically backup an in-memory db or to
	// get a snap-shot of the current database; configure to automatically replicate changes periodically.
	
	db.replicate( config, callback );
	
## isInMemory()
	
	if (db.isInMemory()) {
		log.info('database is in-memory, data will be lost if not backed up...');
	}
	
- - -
<p><small><em>Copyright (c) 2014, rain city software, inc. | Version 0.9.17</em></small></p>