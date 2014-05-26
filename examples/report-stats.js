#!/usr/bin/env node 

'use strict';

var path = require('path'),
    SimpleDb = require( path.join( __dirname, '../lib/SimpleNodeDb' )),
    db = new SimpleDb( path.join( __dirname, 'orderdb' ));

db.stats(function(err, stats) {
    console.dir( stats );
});

