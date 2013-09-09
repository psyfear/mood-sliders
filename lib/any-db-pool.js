/*
 * This module handles the Redis interfacing for permissions-sso
 */
'use strict';

var path = require('path');

// Set up database
var anyDB = require('any-db');
anyDB.adapters.postgres.forceJS = true;

try {
  var pgConn = require(path.join(process.env.PWD, 'config/database'));
} catch (e) {
  var error = new Error('Please define a Postgres configuration file : /config/database.js');
  console.log(error);
}

// This depends on starting node with NODE_ENV=development or whatever
// Defaults to development database
if (process.env.NODE_ENV && !(pgConn[process.env.NODE_ENV])) { throw 'NODE_ENV (' + process.env.NODE_ENV + ') not defined in config/database.js'; }
var neo = pgConn[process.env.NODE_ENV || 'development'].neo;
var dfa = pgConn[process.env.NODE_ENV || 'development'].dfa;

exports.neoPool = anyDB.createPool(neo, {
  min: 5,
  max: 15,
  onConnect: function (conn, done) {
    done(null, conn);
  },
  reset: function (conn, done) {
    done(null);
  }
});

exports.dfaPool = anyDB.createPool(dfa, {
  min: 5,
  max: 15,
  onConnect: function (conn, done) {
    done(null, conn);
  },
  reset: function (conn, done) {
    done(null);
  }
});


// module.exports = dbPool;
