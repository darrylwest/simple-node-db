#!/usr/bin/env node

'use strict';

var log = require('simple-node-logger').createLogger(),
    SimpleDb = require('../lib/SimpleNodeDb'),
    orderBackupFile = './orders.dat',
    db = new SimpleDb( './orderdb' );

db.backup( orderBackupFile, function(err, count) {
    if (err) throw err;

    console.log('order db backed up to : ', orderBackupFile);
    console.log('row count: ', count);
});

