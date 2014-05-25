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
            'find',
            'update',
            'insert',
            'delete',
            'backup',
            'restore',
            'replicate',
            'isInMemory',
            'open',
            'close',
            'createDomainKey',
            '__protected'
        ];

        it('should create a memory-only instance of SimpleNodeDb', function() {
            var db = new SimpleNodeDb();
            should.exist( db );

            db.should.be.instanceof( SimpleNodeDb );

            db.isInMemory().should.equal( true );
        });

        it('should create a file-based instance of SimpleNodeDb', function(done) {
            var dbfile = './simpledb-test-' + dash.random(1000, 9999),
                db = new SimpleNodeDb( dbfile );

            should.exist( db );

            fs.exists( dbfile, function(exists) {
                exists.should.equal( true );

                db.close(function() {
                    levelup.destroy( dbfile );
                    done();
                });
            });
        });

        it('should create a file-based instance of SimpleNodeDb', function(done) {
            var dbfile = 'simpledb-test-' + dash.random(1000, 9999),
                db = new SimpleNodeDb( dbfile );

            should.exist( db );

            fs.exists( dbfile, function(exists) {
                exists.should.equal( true );

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
            batch = dataset.createPutBatch( 'user', users );

        beforeEach(function(done) {
            populateDatabase( db, batch, done );
        });

        it('should backup a database to a file', function(done) {
            var callback = function(err) {
                should.not.exist( err );

                done();
            };

            db.backup( backupFilename, callback );
        });
    });

    describe('restore', function() {
        var db = new SimpleNodeDb();

        it('should restore a database from a file');
    });

    describe('replicate', function() {
        var db = new SimpleNodeDb();

        it('should create a copy of the existing database');
    });
});