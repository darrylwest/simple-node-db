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

    var dataset = new TestDbDataset();

    describe('#instance', function() {
        var methods = [
            'query',
            'find',
            'update',
            'insert',
            'delete',
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

        it('should reject a non-object model');
    });

    describe('update', function() {
        it('should update an existing model');
    });

    describe('delete', function() {
        it('should remove a known model');
    });

    describe('query', function() {
        it('should return a list of known models');
    });

    describe('replicate', function() {
        it('should create a copy of the existing database');
    });
});