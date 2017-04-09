/**
 * @class SimpleNodeDbTests
 *
 * @author: darryl.west@roundpeg.com
 * @created: 5/24/14 1:10 PM
 */
const should = require('chai').should();
const dash = require('lodash');
const TestDbDataset = require('./fixtures/TestDbDataset' );
const SimpleNodeDb = require('../lib/SimpleNodeDb' );
const levelup = require( 'levelup' );
const fs = require('fs');

describe('SimpleNodeDb', function() {
    'use strict';

    const dataset = new TestDbDataset();
    const backupFilename = './backups/db-backup.dat';

    const populateDatabase = function(db, batch, done) {
        const ldb = db.__protected().levelDb;
        ldb.batch( batch, function(err) {
            if (err) throw err;

            done();
        });
    };

    describe('#instance', function() {
        const methods = [
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
            const db = new SimpleNodeDb();
            should.exist( db );

            db.should.be.instanceof( SimpleNodeDb );

            db.isInMemory().should.equal( true );
            db.__protected().readAfterChange.should.equal( true );
        });

        it('should create a file-based instance of SimpleNodeDb', function(done) {
            const dbfile = `./simpledb-test-${dash.random(1000, 9999)}`;
            const db = new SimpleNodeDb( dbfile );

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
            const db = new SimpleNodeDb();

            Object.keys( db ).length.should.equal( methods.length );

            methods.forEach(function(method) {
                db[ method ].should.be.a( 'function' );
            });
        });
    });

    describe('find', function() {
        const db = new SimpleNodeDb();
        const users = dataset.createUserList( 23 );
        const employees = dataset.createUserList( 34 );
        const batch = [];

        dataset.createPutBatch( 'user', users, batch );
        dataset.createPutBatch( 'employee', employees, batch );

        beforeEach(function(done) {
            populateDatabase( db, batch, done );
        });

        it('should return a known model', function(done) {
            const user = users[ 4 ];
            const key = db.createDomainKey( 'user', user.id );

            const callback = function(err, model) {
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
            const user = dataset.createUserModel();
            const db = new SimpleNodeDb();
            const key = db.createDomainKey( 'user', user.id );

            const callback = function(err, model) {
                if (err) {
                    throw err;
                }

                should.not.exist( err );
                should.exist( model );

                // TODO find the user from id
                model.id.should.equal( user.id );

                should.exist( model.dateCreated );
                should.exist( model.lastUpdated );

                model.version.should.equal( 0 );

                const ldb = db.__protected().levelDb;
                ldb.get( key, function(err, u) {
                    should.not.exist( err );
                    should.exist( u );

                    const obj = JSON.parse( u );
                    obj.id.should.equal( user.id );

                    done();
                });
            };

            db.insert( key, user, callback );
        });

        it('should reject a non-object model', function(done) {
            const model = 'this is a bad model';
            const key = 'bad key';
            const db = new SimpleNodeDb();

            const callback = function(err, result) {
                should.exist( err );
                should.not.exist( result );

                done();
            };

            db.insert( key, model, callback );
        });
    });

    describe('update', function() {
        let user = dataset.createUserModel();
        const db = new SimpleNodeDb();
        const key = db.createDomainKey( 'user', user.id );

        db.insert( key, user, function(err, model) {
            user = model;
        });

        it('should update an existing model', function(done) {
            const version = user.version;

            const callback = function(err, model) {
                should.not.exist( err );
                should.exist( model );

                model.version.should.equal( version + 1 );

                done();
            };

            db.update( key, user, callback );
        });
    });

    describe('query', function() {
        const db = new SimpleNodeDb();
        const size = 35;
        const users = dataset.createUserList( size );
        const batch = dataset.createPutBatch( 'user', users );

        beforeEach(function(done) {
            populateDatabase( db, batch, done );
        });

        it('should return a list of known models', function(done) {
            const params = {};

            const rowCallback = function(key, value) {
                return JSON.parse( value );
            };

            const completeCallback = function(err, list) {
                should.not.exist( err );
                should.exist( list );

                list.length.should.be.equal( size );
                const user = list[0];

                should.exist( user.id );

                done();
            };

            db.query( params, rowCallback, completeCallback );
        });
    });

    describe('queryKeys', function() {
        const db = new SimpleNodeDb();
        const size = 30;
        const users = dataset.createUserList( size );
        const batch = dataset.createPutBatch( 'user', users );

        beforeEach(function(done) {
            populateDatabase( db, batch, done );
        });

        it('should return a list of known keys', function(done) {
            const params = {};

            const completeCallback = function(err, keys) {
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
        const db = new SimpleNodeDb();
        const size = 8;
        const users = dataset.createUserList( size );
        const batch = dataset.createPutBatch( 'user', users );

        beforeEach(function(done) {
            populateDatabase( db, batch, done );
        });

        it('should remove a known row from the database', function(done) {
            const user = users[ 4 ];
            const key = db.createDomainKey( 'user', user.id );

            const callback = function(err) {
                should.not.exist( err );
                done();
            };

            db.delete( key, callback );

        });
    });

    describe('backup', function() {
        const db = new SimpleNodeDb();
        const users = dataset.createUserList();
        const batch = dataset.createPutBatch( 'user', users );
        const filename = '/tmp/db-backup.dat';

        beforeEach(function(done) {
            populateDatabase( db, batch, done );
        });

        it('should backup a database to a file', function(done) {
            const callback = function(err, count) {
                should.not.exist( err );
                should.exist( count );

                count.should.equal( users.length );

                done();
            };

            db.backup( filename, callback );
        });
    });

    describe('restore', function() {
        const db = new SimpleNodeDb();

        it('should restore a database from a file', function(done) {
            const callback = function(err, count) {
                should.not.exist( err );
                should.exist( count );

                count.should.equal( 10 );

                done();
            };

            db.restore( backupFilename, callback );
        });

        it('should not restore a file that has a parse error');
    });

    describe('stats', function() {
        const db = new SimpleNodeDb();
        const users = dataset.createUserList( 23 );
        const employees = dataset.createUserList( 34 );
        const batch = [];

        dataset.createPutBatch( 'user', users, batch );
        dataset.createPutBatch( 'employee', employees, batch );

        beforeEach(function(done) {
            populateDatabase( db, batch, done );
        });

        it('should report database stats', function(done) {
            const callback = function(err, stats) {
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
        const db = new SimpleNodeDb();
        const user = dataset.createUserModel();

        // console.log( user );

        it('should parse a json model and set dates to date type', function() {
            const json = JSON.stringify( user );

            const model = db.parseModel( json );

            should.exist( model );
            model.id.should.equal( user.id );

            model.dateCreated.should.be.instanceof( Date );
            model.lastUpdated.should.be.instanceof( Date );

            model.dateCreated.getTime().should.equal( user.dateCreated.getTime() );
            model.lastUpdated.getTime().should.equal( user.lastUpdated.getTime() );
        });
    });
});
