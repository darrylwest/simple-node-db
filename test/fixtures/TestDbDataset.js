/**
 *
 *
 * @author: darryl.west@roundpeg.com
 * @created: 5/24/14 5:16 PM
 */
var dash = require("lodash" ),
    uuid = require('node-uuid' ),
    casual = require('casual');

var TestDbDataset = function() {
    'use strict';

    var dataset = this;

    /**
     * create a standard uuid
     * @returns uuid
     */
    this.createUUID = function() {
        return uuid.v4();
    };

    /**
     * generate object for a base model object, id, dateCreated, lastUpdated and version
     *
     * @returns obj with values id, dateCreated, lastUpdated, version
     */
    this.createBaseModel = function() {
        var obj = {};

        obj.id = uuid.v4().replace(/-/g, '');

        var dt = new Date();
        obj.dateCreated = dt;
        obj.lastUpdated = dt;

        obj.version = 0;

        return obj;
    };

    this.createUserList = function(count) {
        if (!count) count = 25;

        var list = [];

        while ( count-- > 0 ) {
            list.push( dataset.createUserModel() );
        }

        return list;
    };

    this.createPutBatch = function(domain, list, batch) {
        if (!batch) batch = [];

        list.forEach(function(item) {
            var key = domain + ':' + item.id;
            var value = JSON.stringify( item );

            batch.push( { type:'put', key:key, value:value });
        });

        return batch;
    };

    this.createUserModel = function() {
        var params = {};

        params.id = uuid.v4().replace(/-/g, '');
        params.dateCreated = new Date( '2014-01-01T02:03:04' );
        params.lastUpdated = new Date( '2014-01-02T03:04:05' );
        params.version = 0;

        params.name = casual.name;
        params.email = casual.email;
        params.token = uuid.v4();
        params.status = 'active';

        return new User( params );
    };

    var User = function(params) {
        this.id = params.id;
        this.dateCreated = params.dateCreated;
        this.lastUpdated = params.lastUpdated;
        this.version = params.version;

        this.name = params.name;
        this.email = params.email;
        this.token = params.token;
        this.status = params.status;
    };
};

/**
 * extend the child class
 *
 * @param child
 * @returns parent
 */
TestDbDataset.extend = function(child) {
    'use strict';
    var parent = new TestDbDataset();

    dash.extend( child, parent );

    return parent;
};

module.exports = TestDbDataset;