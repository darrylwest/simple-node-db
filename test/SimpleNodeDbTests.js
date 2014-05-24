/**
 *
 *
 * @author: darryl.west@roundpeg.com
 * @created: 5/24/14 1:10 PM
 */
var should = require('chai').should(),
    dash = require('lodash'),
    SimpleNodeDb = require('../lib/SimpleNodeDb');

describe('SimpleNodeDb', function() {
    'use strict';

    var log = require('simple-node-logger' ).createLogger(),
        createOptions;

    createOptions = function() {
        var opts = {};
        opts.log = log;

        return opts;
    };

    describe('#instance', function() {


        it('should create a memory-only instance of SimpleNodeDb', function() {
            var db = new SimpleNodeDb();
            should.exist( db );

            db.should.be.instanceof( SimpleNodeDb );
        });
    });
});