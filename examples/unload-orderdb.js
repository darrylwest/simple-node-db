#!/usr/bin/env node

'use strict';

var path = require('path'),
    log = require('simple-node-logger').createSimpleLogger(),
    SimpleDb = require( path.join( __dirname,  '../lib/SimpleNodeDb' )),
    orderBackupFile = path.join( __dirname, 'orders.dat' ),
    db = new SimpleDb( path.join( __dirname, 'orderdb' ));

db.backup( orderBackupFile, function(err, count) {
    if (err) throw err;

    console.log('order db backed up to : ', orderBackupFile);
    console.log('row count: ', count);
});

