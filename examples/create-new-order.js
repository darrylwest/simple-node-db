#!/usr/bin/env node

'use strict';

var path = require('path'),
    log = require('simple-node-logger').createSimpleLogger(),
    casual = require('casual'),
    SimpleDb = require( path.join( __dirname,  '../lib/SimpleNodeDb' )),
    options = {
        path: path.join( __dirname, 'orderdb' ),
        log:log
    },
    db = new SimpleDb( options ),
    order,
    key;

// define the Order and Order Item objects
var Order = function(params) {
    var order = this;

    if (!params) {
        params = {};
    }

    // the standards attributes
    this.id = params.id;
    this.dateCreated = params.dateCreated;
    this.lastUpdated = params.lastUpdated;
    this.version = params.version;

    this.customer = params.customer;
    this.orderDate = params.orderDate;
    this.total = params.total;

    this.items = params.items;

    this.calcTotal = function() {
        order.total = 0;

        order.items.forEach(function(item) {
            order.total += item.price;
        });

        return order.total;
    };
};

var OrderItem = function(params) {
    var item = this;

    if (!params) {
        params = {};
    }

    this.itemNumber = params.itemNumber;
    this.description = params.description;
    this.price = params.price;
};

var createNewOrder = function() {
    var order,
        params = {
            id:db.createModelId(),
            customer:{
                id:casual.ip,
                name:casual.company_name,
                email:casual.email,
            },
            orderDate:new Date(),
            status:'shipped',
            items:[
                new OrderItem({
                    itemNumber:1,
                    description:casual.words( 3 ),
                    price:casual.integer(10, 100)
                }),
                new OrderItem({
                    itemNumber:2,
                    description:casual.words( 3 ),
                    price:casual.integer(1, 100)
                })
            ]
        };

    log.info('create the order from params: ', params);

    order = new Order( params );
    order.calcTotal();

    return order;

};



// create the new order and key
order = createNewOrder();
key = db.createDomainKey( 'order', order.id );

// do the insert 
db.insert( key, order, function(err, model) {
    log.info('new order posted, key: ', key);
    log.info('model: ', JSON.stringify( model ));
});
