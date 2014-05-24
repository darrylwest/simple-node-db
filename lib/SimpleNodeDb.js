/**
 * @class SimpleNodeDb
 *
 * @author: darryl.west@raincitysoftware.com
 * @created: 5/24/14 1:04 PM
 */
var levelup = require('levelup');

var SimpleNodeDb = function(options) {
    'use strict';

    var sdb = this,
        log,
        db,
        memoryOnly = false;

    var init = function() {
        if (options) {
            log = options.log;
        }

        if (!log) {
            log = require('simple-node-logger' ).createLogger();
        }

        if (!options) {
            log.info('create memory-only db');
            db = levelup({ db:require('memdown')} );
            memoryOnly = true;
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
    };

    /**
     * @returns true if db is in-memory, false if file backed
     */
    this.isMemoryOnly = function() {
        return memoryOnly;
    };

    /**
     * close the current database
     *
     * @param callback(err)
     */
    this.close = function(callback) {
        db.close(callback);
    };

    init();
};

module.exports = SimpleNodeDb;
