'use strict';

var app = require('express')();
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var compression = require('compression');
var config = require('./lib/config');
var mongodb = require('./lib/mongodb');
var pages = require('./app/pages');
var log = require('./lib/logger');
var dbInit = require('./app/models/init');

app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());

// Log startup information
log.info('Server run mode: ' + config.get('env'));
log.info('Server port: ' + config.get('port'));
log.info('Server pid: ' + process.pid);
log.info('Server process title: ' + process.title);
log.info('Server node.js version: ' + process.version);
log.info('Server architecture: ' + process.platform);

// Routes
app.post('/', pages.postPage);

app.use(function(req, res, next) {
    res.status(404).json('Page not found');
});
app.use(logErrors);
app.use(errorHandler);

function logErrors(err, req, res, next) {
    if (err.status && err.status < 500) {
        log.info({ message: 'Client error', error: err });
    } else {
        log.error({ message: 'Server error', error: err });
    }
    next(err);
}

function errorHandler(err, req, res, next) {
    res.status(err.status);
    res.json(err);
}

function initApplication() {
    return mongodb.connect(config.get('mongodb.url'))
        .then(function() {
            log.info('Creating MongoDB indexes when required');
            return dbInit();
        })
        .then(function() {
            return startApplication();
        })
        .catch(function(e) {
            log.error('An error occurred during initialization');
            throw e;
        });
}

function startApplication() {
    var server = app.listen(config.get('port'), function() {
        var host = this.address().address;
        var port = this.address().port;

        log.info('Application listening on http://%s:%s', host, port);
    });
    function exitHandler() {
        log.info('Shutting down application server, waiting for HTTP connections to finish');
        server.close(function () {
            mongodb.connection().close(function() {
                log.info('Server stopped');
                process.exit(0);
            });
        });
    }
    process.on('SIGINT', exitHandler);
    process.on('SIGTERM', exitHandler);
    return server;
}

module.exports = initApplication();
