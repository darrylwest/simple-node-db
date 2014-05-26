#!/usr/bin/env node

'use strict';

var SimpleDb = require('../lib/SimpleNodeDb'),
    db = new SimpleDb('./orderdb');

console.log('restore the user list from backup...');
db.restore( './users.dat', function(err, count) {
    if (err) throw err;

    console.log('user count: ', count);
});

