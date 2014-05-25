/**
 * @class SimpleNodeDb
 *
 * @author: darryl.west@raincitysoftware.com
 * @created: 5/24/14 1:04 PM
 */
var levelup = require('levelup' ),
    uuid = require('node-uuid' ),
    fs = require('fs');

var SimpleNodeDb = function(options) {
    'use strict';

    var sdb = this,
        log,
        db,
        memory = false;

    (function() {
        if (options) {
            log = options.log;
        }

        if (!log) {
            log = require('simple-node-logger' ).createLogger();
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
                }

                // TODO check for other options...
            }
        }
    })();

    /**
     * @returns true if db is in-memory, false if file backed
     */
    this.isInMemory = function() {
        return memory;
    };

    this.query = function(params, rowCallback, completeCallback) {
        log.info('query the database with params: ', params);

        var error,
            list = [],
            stream = db.createReadStream();

        stream.on('data', function(data) {
            var row = rowCallback( data.key, data.value );
            if (row) {
                list.push( row );
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

    this.find = function(key, callback) {
        log.info('find the record with this key: ', key);

        callback(new Error('query not implemented yet'));
    };

    /**
     * insert a data model; set the dateCreated & lastUpdated to now and set version number to zero.
     *
     * @param key - the domain specific key
     * @param model - a data model
     * @param callback(err, model)
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
            }

            return callback( err, model );
        };

        db.put( key, jmodel, insertCallback );
    };

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
            }

            return callback( err, model );
        };

        db.put( key, jmodel, updateCallback );
    };

    this.delete = function(key, callback) {
        log.info('delete the model: ', key);

        db.del( key, callback );
    };

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

    this.restore = function(filename, callback) {
        log.info('restore database from ', filename);

        var opts = {
                flags:'r',
                encoding:'utf-8',
                mode:parseInt('0644', 8), // parse the octal
                autoClose:true,
                fd: null
            },
            batch = [],
            error,
            reader = fs.createReadStream( filename, opts );

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

        reader.on('data', function(chunk) {
            var lines = chunk.toString().split('\n');

            lines.forEach( processLine );
        });

        reader.on('end', function() {
            if (error) return callback( error );

            if (batch.length > 0) {
                log.info('insert the batch, rows: ', batch.length);

                db.batch( batch, function(err) {
                    callback( err, batch.length );
                });
            }
        });
    };

    this.replicate = function(replicatePath, callback) {
        log.info('create a replicate of the current database in: ', replicatePath);

        callback(new Error('query not implemented yet'));
    };

    /**
     * open the database; should provide a callback to give the db time to open
     * @param callback(err)
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
     * @param callback(err)
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
     * @returns an object that exposes the private attributes of this instance
     */
    this.__protected = function() {
        return {
            log:log,
            levelDb:db
        };
    };
};

module.exports = SimpleNodeDb;
