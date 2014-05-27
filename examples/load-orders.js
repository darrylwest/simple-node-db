#!/usr/bin/env node

'use strict';

var path = require('path'),
    SimpleDb = require( path.join( __dirname,  '../lib/SimpleNodeDb' )),
    db = new SimpleDb(path.join( __dirname, 'orderdb' ));

console.log('restore the order db from backup...');
db.restore( path.join( __dirname, 'orders.dat' ), function(err, count) {
    if (err) throw err;

    console.log('row count: ', count);
    db.stats(function(err, stats) {
        console.log('stats: ', JSON.stringify( stats ));
    });
});

