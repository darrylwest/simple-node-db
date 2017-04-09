#!/usr/bin/env node

'use strict';

const path = require('path'),
    SimpleDb = require( path.join( __dirname, '../lib/SimpleNodeDb' )),
    db = new SimpleDb( path.join( __dirname, 'orderdb' ));

const queryAllUsers = function() {
    const rowCallback = function(key, value) {
        if (key.indexOf('user') === 0) {
            return JSON.parse( value );
        }
    }

    const completeCallback = function(err, list) {
        if (err) throw err;

        console.log('all users: ', list.length);
    };


    db.query( {}, rowCallback, completeCallback );
};

const queryHotmailUsers = function() {
    const rowCallback = function(key, value) {
        if (key.indexOf('user') === 0) {
            const user = JSON.parse( value );

            if (user.email.indexOf('@hotmail.com') > 0) {
                return user;
            }
        }
    }

    const completeCallback = function(err, list) {
        if (err) throw err;

        console.log('hotmail users: ', list.length);
    };


    db.query( {}, rowCallback, completeCallback );
};

const queryOrders = function() {

};


queryAllUsers();
queryHotmailUsers();

// qeuryOrders();
