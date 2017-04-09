#!/usr/bin/env node

'use strict';

const path = require('path');
const log = require('simple-node-logger').createSimpleLogger();
const SimpleDb = require( path.join( __dirname,  '../lib/SimpleNodeDb' ));
const orderBackupFile = path.join( __dirname, 'orders.dat' );
const db = new SimpleDb( path.join( __dirname, 'orderdb' ));

db.backup( orderBackupFile, function(err, count) {
    if (err) throw err;

    console.log('order db backed up to : ', orderBackupFile);
    console.log('row count: ', count);
});

