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
        var db = new SimpleNodeDb( createOptions() );

        it('should create an instance of SimpleNodeDb', function() {
            should.exist( db );
        });
    });
});