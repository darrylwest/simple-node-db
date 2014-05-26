#!/usr/bin/env node

'use strict';

var SimpleDb = require('../lib/SimpleNodeDb'),
    db = new SimpleDb('./orderdb');

console.log('restore the order db from backup...');
db.restore( './orders.dat', function(err, count) {
    if (err) throw err;

    console.log('row count: ', count);
});

