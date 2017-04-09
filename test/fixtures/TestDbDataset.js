/**
 *
 *
 * @author: darryl.west@roundpeg.com
 * @created: 5/24/14 5:16 PM
 */
const dash = require("lodash" );
const ulid = require('ulid' );
const fixtureData = require('random-fixture-data');

const TestDbDataset = function() {
    'use strict';

    const dataset = this;

    // the user model
    const User = function(params) {
        this.id = params.id;
        this.dateCreated = params.dateCreated;
        this.lastUpdated = params.lastUpdated;
        this.version = params.version;

        this.name = params.name;
        this.email = params.email;
        this.token = params.token;
        this.status = params.status;
    };

    /**
     * create a standard ulid
     * @returns uulid
     */
    this.createULID = function() {
        return ulid();
    };

    /**
     * generate object for a base model object, id, dateCreated, lastUpdated and version
     *
     * @returns obj with values id, dateCreated, lastUpdated, version
     */
    this.createBaseModel = function() {
        const obj = {};

        obj.id = ulid().replace(/-/g, '');

        const dt = new Date();

        obj.dateCreated = dt;
        obj.lastUpdated = dt;

        obj.version = 0;

        return obj;
    };

    this.createUserList = function(count) {
        if (!count) count = 25;

        const list = [];

        while ( count-- > 0 ) {
            list.push( dataset.createUserModel() );
        }

        return list;
    };

    this.createPutBatch = function(domain, list, batch) {
        if (!batch) batch = [];

        list.forEach(function(item) {
            const key = domain + ':' + item.id;
            const value = JSON.stringify( item );

            batch.push( { type:'put', key:key, value:value });
        });

        return batch;
    };

    this.createUserModel = function() {
        const params = {};

        params.id = ulid().replace(/-/g, '');
        params.dateCreated = new Date( '2014-01-01T02:03:04' );
        params.lastUpdated = new Date( '2014-01-02T03:04:05' );
        params.version = 0;

        params.name = fixtureData.name;
        params.email = fixtureData.email;
        params.token = ulid();
        params.status = 'active';

        return new User( params );
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
    const parent = new TestDbDataset();

    dash.extend( child, parent );

    return parent;
};

module.exports = TestDbDataset;
