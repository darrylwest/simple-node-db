/**
 * @class SimpleNodeDb
 *
 * @author: darryl.west@raincitysoftware.com
 * @created: 5/24/14 1:04 PM
 */
var levelup = require('levelup' ),
    uuid = require('node-uuid' );

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

        completeCallback(new Error('query not implemented yet'));
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
        var jmodel;

        if (typeof model !== 'object') {
            log.error('insert model must be an object');
            return callback(new Error('model must be an object'));
        }

        model.dateCreated = model.lastUpdated = new Date();
        model.version = 0;

        jmodel = JSON.stringify( model );
        log.info('insert the model: ', jmodel);

        db.put( key, JSON.stringify( model ), function(err) {
            if (err) {
                log.error( 'Error inserting model: ', jmodel, ', with key: ', key, ', message: ', err.message );
            }

            return callback( err, model );
        });
    };

    this.update = function(key, model, callback) {
        log.info('update the model: ', model);

        callback(new Error('query not implemented yet'));
    };

    this.delete = function(key, callback) {
        log.info('delete the model: ', key);

        callback(new Error('query not implemented yet'));
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
