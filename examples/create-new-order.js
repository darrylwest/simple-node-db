#!/usr/bin/env node

'use strict';

const path = require('path');
const log = require('simple-node-logger').createSimpleLogger();
const randomData = require('random-fixture-data');
const SimpleDb = require( path.join( __dirname,  '../lib/SimpleNodeDb' ));
const db = new SimpleDb({
    path: path.join( __dirname, 'orderdb' ),
    log:log
});

// define the Order and Order Item objects
const Order = function(params) {
    const order = this;

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

const OrderItem = function(params) {
    const item = this;

    if (!params) {
        params = {};
    }

    this.itemNumber = params.itemNumber;
    this.description = params.description;
    this.price = params.price;
};

const createNewOrder = function() {
    const params = {
        id:db.createModelId(),
        customer:{
            id:randomData.ip,
            name:randomData.companyName,
            email:randomData.email,
        },
        orderDate:new Date(),
        status:'shipped',
        items:[
            new OrderItem({
                itemNumber:1,
                description:randomData.words( 3 ),
                price:randomData.integer(10, 100)
            }),
            new OrderItem({
                itemNumber:2,
                description:randomData.words( 3 ),
                price:randomData.integer(1, 100)
            })
        ]
    };

    log.info('create the order from params: ', params);

    const order = new Order( params );
    order.calcTotal();

    return order;
};

// create the new order and key
const order = createNewOrder();
const key = db.createDomainKey( 'order', order.id );

// do the insert 
db.insert( key, order, function(err, model) {
    log.info('new order posted, key: ', key);
    log.info('model: ', JSON.stringify( model ));
});
