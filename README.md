# Simple Node DB
- - -

[![NPM version](https://badge.fury.io/js/simple-node-db.svg)](http://badge.fury.io/js/simple-node-db) [![Build Status](https://travis-ci.org/darrylwest/simple-node-db.svg?branch=master)](https://travis-ci.org/darrylwest/simple-node-db) [![Dependency Status](https://david-dm.org/darrylwest/simple-node-db.svg)](https://david-dm.org/darrylwest/simple-node-db)

```
   _____            __      _  __        __         ____ 
  / __(_)_ _  ___  / /__   / |/ /__  ___/ /__   ___/ / / 
 _\ \/ /  ' \/ _ \/ / -_) /    / _ \/ _  / -_) / _  / _ \
/___/_/_/_/_/ .__/_/\__/ /_/|_/\___/\_,_/\__/  \_,_/_.__/
           /_/
```

## Overview

A database implementation on top of levelup, leveldown, and memdown.  SimpleNodeDb leverages the document store aspects of level up to provide a data-model/domain centric implementation.   

Models are stored as JSON strings with domain-scoped keys.  For example a user data model's key of '12345' would have an associated domain key of 'user:12345'.  So querying for users as opposed to orders or inventory parts is as easy as including records where keys begin with 'user:'.

Automatic model attributes include dateCreated, lastUpdated and version.  The version attribute is used to enforce optimistic locking.

Typically SimpleNodeDb is well suited for small to medium datasets (less than 100K rows) or data stores that don't require complex querying.  It also provides robust caching when used as an in-memory data store.  To support more than 100K rows you should probably create alternate indexing schemes or stick with redis, mongo, or a traditional SQL database.

_Note: levelup is a simple key/value store.  It may be more appropriate to use this for simple, single user access storage.  SimpleNodeDb is designed to work more as a formal domain data store with simulated domains that contain keyed JSON documents.  For most use cases, it is more appropriate to use redis or another server based document store if multi-user access is required..._

## Change Log

### 0.91.x (requires node 4.x)

* replaced uuid with ulid, a [universally unique lexicographically sortable identifier](https://github.com/alizain/ulid)
* replaced casual with random-fixture-data
* refactored for es6, const/let

_Note: Future changes: for now support goes back to node 4.x; the next release will require 6.x to support more es6 features._

## Installation

```bash
$ npm install simple-node-db --save
```

## Testing And Examples

Basic testing is in place for all implemented methods.  Examples can be found under ./examples.

# API

## constructor

```javascript
// create an in-memory database
const SimpleDb = require('simple-node-db');
let db = new SimpleDb({memory:true});

// create a file based database
db = new SimpleDb('/path/to/database');

// create a database with options
const options = {
	path:'/my/db/path',
	log:new Logger('db'),
	readAfterChange:true // read-back record after insert/update; else return model
};

db = new SimpleDb( options );
```
	
## query( params, rowCallback, completeCallback )

```javascript
// query for all list rows where the key begins with 'mydomain:'

const rowCallback = function(key, value) {
	// put appropriate query conditions here 
	if ( key.indexOf('mydomain:') >= 0) ) {
		// parse and return the value
		return JSON.parse( value );
	}
};

const completeCallback = function(err, list) {
	if (err) throw err;
	
	assert list.length === 25
};

const params = {
	start:'mydomain:',
	end:'mydomain:~'  // the tilde insures all 'my domain' rows are found
};

db.query(params, rowCallback, completeCallback);
```
	
## queryKeys( params, completeCallback )

```javascript
// query for all keys and dump to the console...

db.queryKeys( {}, console.log );
```

## find( key, callback )

```javascript
// create the key based on domain and model id
const key = db.createDomainKey( 'user', id );

// value is saved as a json object
const callback = function(err, model) {
	if (err) throw err;
	
	// do something with the model...
};

db.find( key, callback );
```
	
## insert( key, model, callback )

```javascript
// a simple user model
Const user = {
	id:'12345',
	name:'Sam Sammyson',
	email:'sam@sammyson.com',
	status:'active'
};

// key is created for the 'user' domain
const key = db.createDomainKey( 'user', user.id )

const callback = function(err, model) {
	if (err) throw err;
	
	assert model.dateCreated;
	assert model.lastUpdated === model.dateCreated;
	assert model.version === 0;
};

// model must have an 'id' attribute
db.insert( key, model, callback );
```

## update( key, model, callback )

```javascript
// the version and lastUpdated attributes are automatically updated
const user = {
	id:'12345',
	dateCreated:new Date(),
	lastUpdated:new Date(),
	version:0,
	name:'Sam Sammyson',
	email:'sam@sammyson.com',
	status:'active'
};

const key = db.createDomainKey( 'user', user.id )

const callback = function(err, model) {
	if (err) throw err;
	
	assert model.version === user.version + 1;
	assert model.lastUpdated.getTime() > user.dateCreated.getTime();
};

// model must have an 'id' attribute
db.update( key, model, callback );
```

## delete( key, callback )

```javascript
// very simple, merciless delete -- use at your own risk...
const callback = function(err) {
	if (err) throw err;
};

db.delete( key, callback );
```
	
## createModelId()

```javascript
// create a model id from uuid without dashes
const id = db.createModelId()
```

## createDomainKey( domain, id );

```javascript
const model = {
	id:db.createModelId()
};

const key = db.createDomainKey( 'user', model.id );

assert key.contains( 'user' );
assert key.contains( model.id );
```
	
## backup( filename, callback )

```javascript
// stream dump of keys and values row-by-row, CR/LF delimited
const filename = '/path/to/backup/file';

const callback = function(err, rowsWritten) {
	if (err) throw err;
	
	assert rowsWritten > 0;
};

db.backup( filename, callback );
```

## restore( filename, callback )

```javascript
// read the key/value file and batch put the rows; uses stream reader to 
const callback = function(err, rowsRead) {
	if (err) throw err;
	
	assert rowsRead > 0;
};

const filename = '/path/to/my/backup';

db.restore( filename, callback );
```
	
## stats( callback )

```javascript
// reports the domains and number of rows

db.stats( console.log );
```
	
## close( callback )

```javascript
db.close(function(err) {
	log.info('db is now closed...');
});
```

## open( callback )

```javascript
db.open(function(err) {
	log.info('db is now open...');
});
```

	
## isInMemory()

```javascript
if (db.isInMemory()) {
	log.info('database is in-memory, data will be lost if not backed up...');
}
```
	
## SimpleNodeDb.createREPL( db )

A REPL is available to enable database manipulation from the node repl.

```javascript
// creates a REPL for SimpleNoeDb and opens the database 'db'
// if db is null, then an in-memory db is opened

db = require('simple-node-db').createREPL( './mydb' );
db.stats() // shows the domains, row counts, etc
db.query() // dumps all the rows
db.queryKeys() // dumps all the keys
db.find('user:01BDA1K893NMBH2W1FFRD4W76A') // will return the user if it exists

// query for all users
db.query({start:'user:',end:'user:~'})

// or, an alternative to find all the users...
let rowcb = (key, value) => {
	if (key.startsWith('user:')) {
		return JSON.parse(value);
	}
};
db.query({}, rowcb)

```

- - -
<p><small><em>Copyright © 2014-2017, rain city software, inc. | Version 0.91.10</em></small></p>
