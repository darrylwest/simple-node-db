/**
 *
 *
 * @author: darryl.west@roundpeg.com
 * @created: 5/24/14 1:10 PM
 */
var should = require('chai').should(),
    dash = require('lodash'),
    SimpleNodeDb = require('../lib/SimpleNodeDb' ),
    fs = require('fs');

describe('SimpleNodeDb', function() {
    'use strict';

    var dbfile = './simpledb-test';

    describe('#instance', function() {
        var methods = [
            'query',
            'find',
            'update',
            'insert',
            'delete',
            'replicate',
            'isMemoryOnly',
            'dbPath'
        ];

        it('should create a memory-only instance of SimpleNodeDb', function() {
            var db = new SimpleNodeDb();
            should.exist( db );

            db.should.be.instanceof( SimpleNodeDb );

            db.isMemoryOnly().should.equal( true );
        });

        it('should create a file-based instance of SimpleNodeDb', function(done) {
            var db = new SimpleNodeDb( dbfile );

            should.exist( db );

            fs.exists( dbfile, function(exists) {
                exists.should.equal( true );

                done();
            });
        });
    });
});