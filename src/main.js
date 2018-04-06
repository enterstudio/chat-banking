/*
 * Author: Mayur Jain
 * */

/* jshint node: true, devel: true */
'use strict';
import {} from 'dotenv/config'

const
    bodyParser = require('body-parser'),
    express = require('express'),
    request = require('request'),
    httpStatus = require('http-status'),
    morgan = require('morgan'),
    cluster = require('cluster');

let app = express();
app.set('port', process.env.PORT || 5000);
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(morgan('combined'));
app.all('/*', function (req, res, next) {
    // CORS headers
    res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    // Set custom headers for CORS
    res.header('Access-Control-Allow-Headers', 'Content-Type,Accept,Authorization');

    // The X-Frame-Options HTTP header restricts who can put your site in a frame which can help mitigate things like clickjacking attacks
    // Allow from a specific host:
    res.header('X-Frame-Options', 'allow-from www.messenger.com');
    res.header("Content-Security-Policy", "frame-ancestors www.messenger.com");

    if (req.method == 'OPTIONS') {
        res.status(httpStatus.OK).end();
    } else {
        next();
    }
});

const Botkit = require('botkit');
const async = require('async');

const KeyStore = new Map();
let controller, bot;
const configuration = require('./configuration/appConfiguration');

//Ping API
app.get('/ping', (req, res) => {
    res.status(httpStatus.OK).send('OK');
});

function startApplication(callback) {

    async.series([

            (callback) => {
                configuration.loadConfigurationFromS3(KeyStore, callback);
            },

            (callback) => {

                controller = Botkit.facebookbot({
                    debug: false,
                    access_token: KeyStore.get('MESSENGER_PAGE_ACCESS_TOKEN'),
                    verify_token: KeyStore.get('MESSENGER_VALIDATION_TOKEN'),
                    require_delivery: true,
                    receive_via_postback: true,
                });
                bot = controller.spawn({});
                app.set('controller', controller);
                app.set('bot', bot);
                app.set('KeyStore', KeyStore);
                module.exports = app; //expose app so that it is available in all other routes
                app.use(bodyParser.json({verify: require('./middelware/verifySignature').verifyRequestSignature}));
                const config = require('./resources/configuration.json');
                console.log(`\nNODE_ENV: ${config['ENV']}\n`);
                callback(null, 'Exposed App Controller');
            },

            (callback) => {
                try {
                    require('./db/mysqlConnection');
                    let routes = require('./routes/routes');
                    require('./routes/subscribeToFacebook');
                    require('./controllers/botkit.controller');
                    app.use(routes);

                    callback(null, 'Loaded Application Routes');
                }
                catch (error) {
                    console.error("\nError loading application routes.");
                    console.error(error, error.stack);
                    process.exit(3);
                }
            }
        ],

        function (err, results) {
            if (err) {
                console.log(err);
                callback({success: false});
            }
            console.log({APP_STARTUP_RESULT: results});
            callback({success: true});
        });
}


startApplication((result) => {

    if (result.success == true) {

        const server = app.listen(app.get('port'), function () {
            console.log(`\nChatbot server running on port ${app.get('port')} with process id ${process.pid}\n`);
        });

        const config = require('./resources/configuration.json');
        console.log("\n");
        console.log({REQUEST_DEBUG: config['REQUEST_DEBUG']});
        //log http request & response
        if (config['REQUEST_DEBUG']) require('request-debug')(request);

        //Error Handling middleware. This should be at the last. Don't move
        app.use(function (err, req, res, next) {
            console.log("Error: \n");
            console.error(err.stack);
            res.status(400).send('Bad Request. Please Contact Customer Support');
        })
    }
    else {
        console.log("\nFailed starting application server.");
    }
});

/**
 * Setup Application Cluster for High Scalability
 * */

/*
 if (process.env.NODE_ENV == "test") {
 // Start server
 app.listen(app.get('port'), function () {
 console.log('\nChatbot server running on port', app.get('port'));
 });
 }
 else
 if (cluster.isMaster) {
 let numWorkers = require('os').cpus().length;

 console.log('Master cluster setting up ' + numWorkers + ' workers...');

 startApplication();

 for (let i = 0; i < numWorkers; i++) {
 cluster.fork();
 }

 cluster.on('online', function (worker) {
 console.log('Worker ' + worker.process.pid + ' is online');
 });

 cluster.on('exit', function (worker, code, signal) {
 console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
 console.log('Starting a new worker');
 cluster.fork();
 });
 } else {
 const server = app.listen(8000, function () {
 console.log('Process ' + process.pid + ' is listening to all incoming requests');
 });

 const config = require('./resources/configuration.json');
 if (config['REQUEST_DEBUG'])  //log http request & response
 require('request-debug')(request);
 }
 }
 */


module.exports = app;