var cluster = require('cluster');
var Util = require('util');
var path = require('path');
var numCPUs = require('os').cpus().length;
var numCPUs = 1;
var i;
var self = this;
var autoRestart = false;
var grunt = require('grunt');
var redis = require("redis");
var redisClient = redis.createClient();
global.redisClient = redisClient;
// var structure = require('structures');

var sugar = require('sugar');


function workerExit(code, signal) {
  if (signal) {
    console.log("worker was killed by signal: " + signal);
  } else if (code !== 0) {
    console.log("worker exited with error code: " + code);
  } else {
    console.log("worker success!");
  }
  if (autoRestart) {
    console.log('Restarting worker thread...');
    cluster.fork();
  }
}

if (cluster.isMaster) {
  console.log('Master process ' + process.pid + ' started');
  for (i = 0; i < numCPUs; ++i) {
    var worker = cluster.fork();
    worker.on('exit', workerExit);
  }
} else {
  // Start the server.

  var os = require('os');
  var TwitterStrategy = require('passport-twitter').Strategy;
  var express = require('express');

  var users = [];

  console.log('Host is : ' + os.hostname());
  console.log('Worker #' + cluster.worker.id + ' started');

  var APIBuilder = require('api-builder');
  var api = new APIBuilder({
    controllers: 'app/controllers',
    models: 'app/models',
    structures: 'app/structures',
    port: 3005
  });
  api.init();
  // Keep a handle to the (express) app globally
  var app = global.app = api.app;

  // console.log(controllers);

  var http = require('http');
  var swig = require('swig');
  var cons = require('consolidate');
  app.engine('.html', cons.swig);
  app.set('view engine', 'html');

  // Enable Sessions
  //app.use(express.cookieParser());
  //app.use(express.session({secret: '1234567890QWERTY'}));

  var viewDir = process.cwd() + '/app/views';
  swig.init({
    root: viewDir,
    allowErrors: true,
    cache: false,
    encoding: 'utf8'
  });

  app.set('views', viewDir);

  // simple logger
  app.use(function(req, res, next){
    console.log('%s %s', req.method, req.url);
    next();
  });

  // Set up some stats
  var stats = {};
  stats.numRequests = 0;
  app.configure(function () {
    app.use(express.bodyParser());  // Handle POST requests
    app.use(express.cookieParser());
    // app.use(express.compress());
    app.use(express.methodOverride());
    app.use(express.session({ secret: '498f99f3bbee4ae3a075eada02488464' }));
    // set user to session
    app.use(function(req, res, next){
      //models.Authentication.auth_and_get_session(req);
      next();
    });
    app.use(app.router);
    app.use(express.errorHandler({ showStack: true, dumpExceptions: true }));
  });
  api.app = app;
  api.loadRoutes();
}
