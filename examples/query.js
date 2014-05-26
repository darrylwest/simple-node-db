#!/usr/bin/env node

'use strict';

var path = require('path'),
    SimpleDb = require( path.join( __dirname, '../lib/SimpleNodeDb' )),
    db = new SimpleDb( path.join( __dirname, 'orderdb' ));

var queryAllUsers = function() {
    var rowCallback = function(key, value) {
        if (key.indexOf('user') === 0) {
            return JSON.parse( value );
        }
    }

    var completeCallback = function(err, list) {
        if (err) throw err;

        console.log('all users: ', list.length);
    };


    db.query( {}, rowCallback, completeCallback );
};

var queryHotmailUsers = function() {
    var rowCallback = function(key, value) {
        if (key.indexOf('user') === 0) {
            var user = JSON.parse( value );

            if (user.email.indexOf('@hotmail.com') > 0) {
                return user;
            }
        }
    }

    var completeCallback = function(err, list) {
        if (err) throw err;

        console.log('hotmail users: ', list.length);
    };


    db.query( {}, rowCallback, completeCallback );
};

var queryOrders = function() {

};


queryAllUsers();
queryHotmailUsers();

// qeuryOrders();
