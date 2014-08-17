/**
 *
 *
 * @author: darryl.west@roundpeg.com
 * @created: 5/24/14 1:10 PM
 */
var should = require('chai').should(),
    dash = require('lodash'),
    TestDbDataset = require('./fixtures/TestDbDataset' ),
    SimpleNodeDb = require('../lib/SimpleNodeDb' ),
    levelup = require( 'levelup' ),
    fs = require('fs');

describe('SimpleNodeDb', function() {
    'use strict';

    var dataset = new TestDbDataset(),
        backupFilename = './backups/db-backup.dat',
        populateDatabase;

    populateDatabase = function(db, batch, done) {
        var ldb = db.__protected().levelDb;
        ldb.batch( batch, function(err) {
            if (err) throw err;

            done();
        });
    };

    describe('#instance', function() {
        var methods = [
            'query',
            'queryKeys',
            'find',
            'update',
            'insert',
            'delete',
            'backup',
            'restore',
            'stats',
            'isInMemory',
            'open',
            'close',
            'createModelId',
            'createDomainKey',
            'parseModel',
            '__protected'
        ];

        it('should create a memory-only instance of SimpleNodeDb', function() {
            var db = new SimpleNodeDb();
            should.exist( db );

            db.should.be.instanceof( SimpleNodeDb );

            db.isInMemory().should.equal( true );
            db.__protected().readAfterChange.should.equal( true );
        });

        it('should create a file-based instance of SimpleNodeDb', function(done) {
            var dbfile = './simpledb-test-' + dash.random(1000, 9999),
                db = new SimpleNodeDb( dbfile );

            should.exist( db );

            fs.exists( dbfile, function(exists) {
                // exists.should.equal( true );

                db.close(function() {
                    levelup.destroy( dbfile );
                    done();
                });
            });
        });

        it('should have all know methods by size and type', function() {
            var db = new SimpleNodeDb();

            dash.methods( db ).length.should.equal( methods.length );

            methods.forEach(function(method) {
                db[ method ].should.be.a( 'function' );
            });
        });
    });

    describe('find', function() {
        var db = new SimpleNodeDb(),
            users = dataset.createUserList( 23 ),
            employees = dataset.createUserList( 34 ),
            batch = [];

        dataset.createPutBatch( 'user', users, batch );
        dataset.createPutBatch( 'employee', employees, batch );

        beforeEach(function(done) {
            populateDatabase( db, batch, done );
        });

        it('should return a known model', function(done) {
            var callback,
                user = users[ 4 ],
                key = db.createDomainKey( 'user', user.id );

            callback = function(err, model) {
                should.not.exist( err );
                should.exist( model );

                model.id.should.equal( user.id );

                done();
            };

            db.find( key, callback );
        });
    });

    describe('insert', function() {
        it('should insert a new model and set dateCreated, lastUpdated and version', function(done) {
            var user = dataset.createUserModel(),
                db = new SimpleNodeDb(),
                key = db.createDomainKey( 'user', user.id ),
                callback;

            callback = function(err, model) {
                if (err) throw err;

                should.not.exist( err );
                should.exist( model );

                // TODO find the user from id
                model.id.should.equal( user.id );

                should.exist( model.dateCreated );
                should.exist( model.lastUpdated );

                model.version.should.equal( 0 );

                var ldb = db.__protected().levelDb;
                ldb.get( key, function(err, u) {
                    should.not.exist( err );
                    should.exist( u );

                    var obj = JSON.parse( u );
                    obj.id.should.equal( user.id );

                    done();
                });
            };

            db.insert( key, user, callback );
        });

        it('should reject a non-object model', function(done) {
            var model = 'this is a bad model',
                key = 'bad key',
                db = new SimpleNodeDb(),
                callback;

            callback = function(err, result) {
                should.exist( err );
                should.not.exist( result );

                done();
            };

            db.insert( key, model, callback );
        });
    });

    describe('update', function() {
        var user = dataset.createUserModel(),
            db = new SimpleNodeDb(),
            key = db.createDomainKey( 'user', user.id );

        db.insert( key, user, function(err, model) {
            user = model;
        });

        it('should update an existing model', function(done) {
            var version = user.version;

            var callback = function(err, model) {
                should.not.exist( err );
                should.exist( model );

                model.version.should.equal( version + 1 );

                done();
            };

            db.update( key, user, callback );
        });
    });

    describe('query', function() {
        var db = new SimpleNodeDb(),
            size = 35,
            users = dataset.createUserList( size ),
            batch = dataset.createPutBatch( 'user', users );

        beforeEach(function(done) {
            populateDatabase( db, batch, done );
        });

        it('should return a list of known models', function(done) {
            var rowCallback,
                completeCallback,
                params = {};

            rowCallback = function(key, value) {
                return JSON.parse( value );
            };

            completeCallback = function(err, list) {
                should.not.exist( err );
                should.exist( list );

                list.length.should.be.equal( size );
                var user = list[0];

                should.exist( user.id );

                done();
            };

            db.query( params, rowCallback, completeCallback );
        });
    });

    describe('queryKeys', function() {
        var db = new SimpleNodeDb(),
            size = 30,
            users = dataset.createUserList( size ),
            batch = dataset.createPutBatch( 'user', users );

        beforeEach(function(done) {
            populateDatabase( db, batch, done );
        });

        it('should return a list of known keys', function(done) {
            var completeCallback,
                params = {};

            completeCallback = function(err, keys) {
                should.not.exist( err );
                should.exist( keys );

                // console.log( keys );

                keys.length.should.be.equal( size );
                keys[0].indexOf('user:' ).should.equal( 0 );

                done();
            };

            db.queryKeys( params, completeCallback );
        });
    });

    describe('delete', function() {
        var db = new SimpleNodeDb(),
            size = 8,
            users = dataset.createUserList( size ),
            batch = dataset.createPutBatch( 'user', users );

        beforeEach(function(done) {
            populateDatabase( db, batch, done );
        });

        it('should remove a known row from the database', function(done) {
            var user = users[ 4 ],
                key = db.createDomainKey( 'user', user.id ),
                callback;

            callback = function(err) {
                should.not.exist( err );
                done();
            };

            db.delete( key, callback );

        });
    });

    describe('backup', function() {
        var db = new SimpleNodeDb(),
            users = dataset.createUserList(),
            batch = dataset.createPutBatch( 'user', users ),
            filename = '/tmp/db-backup.dat';

        beforeEach(function(done) {
            populateDatabase( db, batch, done );
        });

        it('should backup a database to a file', function(done) {
            var callback = function(err, count) {
                should.not.exist( err );
                should.exist( count );

                count.should.equal( users.length );

                done();
            };

            db.backup( filename, callback );
        });
    });

    describe('restore', function() {
        var db = new SimpleNodeDb();

        it('should restore a database from a file', function(done) {
            var callback = function(err, count) {
                should.not.exist( err );
                should.exist( count );

                count.should.equal( 25 );

                done();
            };

            db.restore( backupFilename, callback );
        });

        it('should not restore a file that has a parse error');
    });

    describe('stats', function() {
        var db = new SimpleNodeDb(),
            users = dataset.createUserList( 23 ),
            employees = dataset.createUserList( 34 ),
            batch = [];

        dataset.createPutBatch( 'user', users, batch );
        dataset.createPutBatch( 'employee', employees, batch );

        beforeEach(function(done) {
            populateDatabase( db, batch, done );
        });

        it('should report database stats', function(done) {
            var callback = function(err, stats) {
                should.not.exist( err );
                should.exist( stats );

                console.log( stats );

                stats.rowcount.should.equal( users.length + employees.length );

                dash.size( stats.domains ).should.equal( 2 );
                stats.domains.user.should.equal( users.length );
                stats.domains.employee.should.equal( employees.length );

                done();
            };

            db.stats( callback );
        });
    });

    describe('parseModel', function() {
        var db = new SimpleNodeDb(),
            user = dataset.createUserModel();

        // console.log( user );

        it('should parse a json model and set dates to date type', function() {
            var json = JSON.stringify( user ),
                model;

            model = db.parseModel( json );

            should.exist( model );
            model.id.should.equal( user.id );

            model.dateCreated.should.be.instanceof( Date );
            model.lastUpdated.should.be.instanceof( Date );

            model.dateCreated.getTime().should.equal( user.dateCreated.getTime() );
            model.lastUpdated.getTime().should.equal( user.lastUpdated.getTime() );
        });
    });
});
