#!/usr/bin/env node 

'use strict';

const path = require('path');
const SimpleDb = require( path.join( __dirname, '../lib/SimpleNodeDb' ));
const db = new SimpleDb( path.join( __dirname, 'orderdb' ));

db.stats(function(err, stats) {
    console.dir( stats );
});

