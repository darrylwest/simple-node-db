/**
 * @class SimpleNodeDb
 * @classdesc A simple domain centric wrapper over leveldb with backup and restore.
 *
 * @author: darryl.west@raincitysoftware.com
 * @created: 5/24/14 1:04 PM
 */
var levelup = require( 'levelup' ),
    uuid = require( 'node-uuid' ),
    fs = require( 'fs' );

/**
 * @param options memory only, db file name, etc
 * @constructor
 */
var SimpleNodeDb = function(options) {
    'use strict';

    var sdb = this,
        log,
        db,
        readAfterChange = true,
        memory = false,
        queryRowCallback,
        dfltCompleteCallback;

    (function() {
        if (options) {
            log = options.log;
        }

        if (!log) {
            log = require('simple-node-logger' ).createSimpleLogger();
            log.setLevel( 'warn' );
        }

        if (!options) {
            log.info('create memory-only db');
            db = levelup({ db:require('memdown')} );
            memory = true;
        } else {
            if (typeof options === 'string') {

                log.info('create the database: ', options);
                db = levelup( options );
            } else {
                if (options.path) {
                    log.info('create the database: ', options.path);
                    db = levelup( options.path );
                } else {
                    log.info('create in-memory database');
                    db = levelup( { db:require('memdown')} );
                    memory = true;
                }

                if (options.hasOwnProperty( 'readAfterChange' )) {
                    readAfterChange = options.readAfterChange;
                }

                queryRowCallback = options.rowCallback;
                dfltCompleteCallback = options.completeCallback;
            }
        }
    })();

    /**
     * @returns true if db is in-memory, false if file backed
     */
    this.isInMemory = function() {
        return memory;
    };

    /**
     * query for a list of matching rows using rowCallback to evaluate key or model criteria.  When a match
     * is detected the model (parsed from value) is returned.
     *
     * @param params - start, end, reverse -- the level stream options: https://github.com/rvagg/node-levelup#createReadStream
     * @param rowCallback - key, value; (value is the json string; it must be parsed to create the model
     * @param completeCallback - err, list
     */
    this.query = function(params, rowCallback, completeCallback) {
        log.info('query the database with params: ', params);

        var error,
            list = [],
            stream = db.createReadStream(params);

        if (!rowCallback) rowCallback = queryRowCallback;
        if (!completeCallback) completeCallback = dfltCompleteCallback;

        stream.on('data', function(data) {
            var row = rowCallback( data.key, data.value );
            if (row) {
                list.push( sdb.parseModel( row ));
            }
        });

        stream.on('error', function(err) {
            log.error('error in query stream: ', err.message);
            error = err;
        });

        stream.on('end', function() {
            completeCallback( error, list );
        });
    };

    /**
     * read and return all the keys using optional params; params include start, end, reverse
     *
     * @param params - null, start, end, reverse: the level stream options: https://github.com/rvagg/node-levelup#createReadStream
     * @param completeCallback
     */
    this.queryKeys = function(params, completeCallback) {
        log.info('query for keys with params: ', params);

        var error,
            keys = [],
            stream = db.createKeyStream();

        if (!completeCallback) completeCallback = dfltCompleteCallback;

        stream.on('error', function(err) {
            log.error('error in query stream: ', err.message);
            error = err;
        });

        stream.on('data', function(key) {
            keys.push( key );
        });

        stream.on('end', function() {
            completeCallback( error, keys );
        });
    };

    /**
     * find the single model by key; returns the parsed model if found, error if not found (err.isNotFound)
     *
     * @param key - the domain key for a specified model
     * @param callback - err, model
     */
    this.find = function(key, callback) {
        log.info('find the record with this key: ', key);

        if (!callback) {
            callback = dfltCompleteCallback;
        }

        db.get( key, function(err, value ) {
            if (err) {
                log.error( err.message );
                return callback( err );
            }

            callback( err, sdb.parseModel( value ) );
        });
    };

    /**
     * insert a data model; set the dateCreated & lastUpdated to now and set version number to zero.
     *
     * @param key - the domain specific key
     * @param model - a data model
     * @param callback - err, model
     */
    this.insert = function(key, model, callback) {
        var jmodel,
            insertCallback;

        if (typeof model !== 'object') {
            log.error('insert model must be an object');
            return callback(new Error('model must be an object'));
        }

        model.dateCreated = model.lastUpdated = new Date();
        model.version = 0;

        jmodel = JSON.stringify( model );
        log.info('insert the model: ', jmodel);

        insertCallback = function(err) {
            if (err) {
                log.error( 'Error inserting model: ', jmodel, ', with key: ', key, ', message: ', err.message );
                return callback( err );
            }

            if (readAfterChange) {
                return sdb.find( key, callback );
            } else {
                return callback( err, model );
            }
        };

        db.put( key, jmodel, insertCallback );
    };

    /**
     * update the current model; bump the version number and update the lastUpdated timestamp
     *
     * @param key
     * @param model
     * @param callback - err, model
     */
    this.update = function(key, model, callback) {
        var jmodel,
            updateCallback;

        if (typeof model !== 'object') {
            log.error('insert model must be an object');
            return callback(new Error('model must be an object'));
        }

        model.lastUpdated = new Date();
        model.version = model.version + 1;

        jmodel = JSON.stringify( model );
        log.info('update the model: ', jmodel);

        updateCallback = function(err) {
            if (err) {
                log.error( 'Error inserting model: ', jmodel, ', with key: ', key, ', message: ', err.message );
                return callback( err );
            }

            if (readAfterChange) {
                return sdb.find( key, callback );
            } else {
                return callback( err, model );
            }
        };

        db.put( key, jmodel, updateCallback );
    };

    /**
     * delete the model by key;
     *
     * @param key
     * @param callback - err
     */
    this.delete = function(key, callback) {
        log.info('delete the model: ', key);

        db.del( key, callback );
    };

    /**
     * backup/unload the current database to a key/value file.
     *
     * @param filename - full path the the backup file
     * @param callback - err, rowCount
     */
    this.backup = function(filename, callback) {
        log.info('backup the database to ', filename);

        var opts = {
                flags:'w',
                encoding:'utf-8',
                mode:parseInt('0644', 8) // parse the octal
            },
            count = 0,
            error,
            writer = fs.createWriteStream( filename, opts ),
            reader = db.createReadStream();

        if (!callback) {
            callback = function(err, rows) {
                if (err) {
                    log.error( err.message );
                } else {
                    log.info( 'rows saved: ', rows );
                }
            };
        }

        writer.on('finish', function() {
            callback( error, count );
        });

        reader.on('data', function(data) {
            writer.write( data.key );
            writer.write( ',' );
            writer.write( data.value );
            writer.write( '\n' );

            count++;
        });

        reader.on('error', function(err) {
            log.error( 'read error: ', err.message );
            writer.end();
        });

        reader.on('end', function() {
            writer.end();
        });
    };

    /**
     * restore the backup file.  the restore process only adds/updates values to the database so multiple
     * files may be restored without affecting other non-related database rows.
     *
     * @param filename - full path to the restore file
     * @param callback - err, rowsRestored
     */
    this.restore = function(filename, callback) {
        log.info('restore database from ', filename);

        var readline = require('readline' ),
            outstream = new require('stream' ),
            opts = {
                flags:'r',
                encoding:'utf-8',
                mode:parseInt('0644', 8), // parse the octal
                autoClose:true,
                fd: null
            },
            batch = [],
            error,
            instream = fs.createReadStream( filename, opts ),
            lineReader;

        if (!callback) {
            callback = function(err, rows) {
                if (err) {
                    log.error( err.message );
                } else {
                    log.info( 'rows restored: ', rows );
                }
            };
        }

        var processLine = function(line) {
            var idx,
                key,
                value,
                model;

            if (line && line.indexOf(',') > 1) {
                idx = line.indexOf(',');
                key = line.substr(0, idx );
                value = line.substr( idx + 1 );
                if (key && value) {
                    try {
                        model = JSON.parse( value );
                        batch.push({ type:'put', key:key, value:value });
                    } catch (e) {
                        log.error('PARSE ERROR! line:', line);
                        log.error( e.message );
                        error = e;
                    }
                }
            }
        };

        lineReader = readline.createInterface( instream, outstream );
        lineReader.on('line', processLine );

        instream.on('close', function() {
            if (error) return callback( error );

            if (batch.length > 0) {
                log.info('insert the batch, rows: ', batch.length);

                db.batch( batch, function(err) {
                    callback( err, batch.length );
                });
            }
        });
    };

    /**
     * calculate the database stats and verify that each row parses without error.
     *
     * @param callback - err, stats
     */
    this.stats = function(callback) {
        log.info('calculate stats');

        var domains = {},
            errors = [],
            count = 0,
            stream = db.createReadStream();

        if (!callback) {
            callback = function(err, stats) {
                if (err) {
                    log.error( err.message );
                } else {
                    log.info( JSON.stringify( stats ));
                }
            };
        }

        stream.on('data', function(data) {
            var key = data.key,
                value = data.value,
                domain = data.key.split(':')[0];

            count++;

            if (domains.hasOwnProperty( domain )) {
                domains[ domain ] = domains[ domain ] + 1;
            } else {
                domains[ domain ] = 1;
            }

            try {
                var obj = JSON.parse( value );
            } catch(e) {
                log.error( e.message );
                log.error('error parsing value: ', value);
                errors.push( { key:key, value:value, message: e.messasge } );
            }
        });

        stream.on('error', function(err) {
            log.error('error in query stream: ', err.message);
            errors.push( err.message );
        });

        stream.on('end', function(err) {
            var stats = {
                rowcount:count,
                domains:domains,
                errors:errors
            };

            callback( err, stats );
        });
    };

    /**
     * open the database; should provide a callback to give the db time to open
     * @param callback - err
     */
    this.open = function(callback) {
        if (db.isOpen()) {
            log.warn('attempt to open an opened database, request ignored...');
            callback();
        } else {
            log.info('open/reopen the database...');
            db.open(callback);
        }
    };

    /**
     * close the current database
     *
     * @param callback - err
     */
    this.close = function(callback) {
        if (db.isClosed()) {
            log.warn('attempt to close a closed database, request ignored...');
            callback();
        } else {
            log.info('close the database...');
            db.close(callback);
        }
    };

    /**
     * create a unique id using uuid without the dashes
     * @returns unique id
     */
    this.createModelId = function() {
        return uuid.v4().replace(/-/g, '');
    };

    /**
     * create a domain key using the domain name + ':' + a generated uuid
     *
     * @param domain - the name of the domain, e.g., user, order, etc.
     * @returns the new id/key
     */
    this.createDomainKey = function(domain, id) {
        if (!id) {
            id = uuid.v4().replace(/-/g, '');
        }

        if (domain) {
            id = domain + ':' + id;
        }

        return id;
    };

    /**
     * parse the model (if JSON string) and set dateCreated and lastUpdated to date types
     *
     * @param value JSON string or model object
     * @returns model
     */
    this.parseModel = function(value) {
        var model;

        if (typeof value === 'string') {
            model = JSON.parse( value );
        } else {
            model = value;
        }

        if (typeof model.dateCreated === 'string') {
            model.dateCreated = new Date( model.dateCreated );
        }

        if (typeof model.lastUpdated === 'string') {
            model.lastUpdated = new Date( model.lastUpdated );
        }

        return model;
    };

    /**
     * @returns an object that exposes the private attributes of this instance
     */
    this.__protected = function() {
        return {
            log:log,
            levelDb:db,
            readAfterChange:readAfterChange
        };
    };
};

SimpleNodeDb.createREPL = function(opts) {
    'use strict';

    var log;

    if (typeof opts === 'string') {
        opts = { path:opts };
    }

    if (!opts) opts = {};

    if (!opts.log) {
        opts.log = require('simple-node-logger' ).createLogger();
    }

    log = opts.log;

    if (!opts.rowCallback) {
        opts.rowCallback = function(key, value) {
            log.info( key, ':', value );
            return db.parseModel( value );
        };
    }

    if (!opts.completeCallback) {
        opts.completeCallback = function(err, result) {
            if (err) {
                log.error( err.message );
            } else {
                log.info( result );
            }
        };
    }

    var db = new SimpleNodeDb( opts );

    return db;
};

module.exports = SimpleNodeDb;
