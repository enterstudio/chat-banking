/**
 * Created by mayujain on 9/22/16.
 */

'use strict';

const request = require('request');
const randomstring = require('randomstring');
const httpStatus = require('http-status');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const _ = require('underscore');
const ursa = require('ursa');

const config = require('./resources/configuration.json');
const app = require('./main');
const KeyStore = app.get('KeyStore');
const MESSENGER_PAGE_ACCESS_TOKEN = KeyStore.get('MESSENGER_PAGE_ACCESS_TOKEN');
const APIAI_ACCESS_TOKEN = KeyStore.get('APIAI_ACCESS_TOKEN');
const MESSENGER_API_HOST = config['MESSENGER_API']['HOST'];
const MESSENGER_API_BASE_URL = MESSENGER_API_HOST + config['MESSENGER_API']['VERSION'];
const MESSENGER_SUBSCRIBE_ENDPOINT = config['MESSENGER_API']['SUBSCRIBE_ENDPOINT'];
const MESSENGER_MESSAGES_ENDPOINT = config['MESSENGER_API']['MESSAGES_ENDPOINT'];
const NLP_AGENT_HOST = config['NLP_AGENT_API']['HOST'];
const CTC_HOST = config['CTC_API']['HOST'];
const CTC_AUTH_DECISION_ENDPOINT = config['CTC_API']['AUTH_DECISION_ENDPOINT'];
const NLP_QUERY_ENDPOINT = config['NLP_AGENT_API']['QUERY_ENDPOINT'];
const BANK_IDENTIFIER = config['BANK_IDENTIFIER'];
const ENCRYPTION_PUBLIC_KEY_NAME = config['ENCRYPTION_PUBLIC_KEY_NAME'];
const DECRYPTION_PRIVATE_KEY_NAME = config['DECRYPTION_PRIVATE_KEY_NAME'];
const publicKeyFilePath = path.join(__dirname, './resources/', ENCRYPTION_PUBLIC_KEY_NAME);
const privateKeyFilePath = path.join(__dirname, './resources/', DECRYPTION_PRIVATE_KEY_NAME);

module.exports = {
    isDefined,
    getFacebookProfile,
    doSubscribe,
    getFormattedDate,
    getRandomString,
    sendQueryToNlpAgent,
    sendMessageToMessenger,
    convertTimeToUsersTimezone,
    sendTypingOnIndicatorsToMessenger,
    encryptRSA,
    decryptRSA,
    getFileFromURL,
    getRandomNumber,
    simulateTransaction
};

/**
 * Validates object and return boolean
 * */
function isDefined(obj) {
    if (typeof obj == 'undefined')
        return false;

    if (!obj)
        return false;

    return obj != null;
}

/**
 * Get user public profile information using Facebook Graph API
 * */
function getFacebookProfile(id) {
    return new Promise((resolve, reject) => {

        request({
            method: 'GET',
            uri: `${MESSENGER_API_BASE_URL}/${id}`,
            qs: {
                fields: 'first_name,last_name,locale,timezone,gender',
                access_token: MESSENGER_PAGE_ACCESS_TOKEN,
            },
            json: true
        }, (err, res, body) => {
            if (err) {

                console.log(err);
                reject(err);
            }
            else if (body.error) {
                console.log(body.error);
                reject(body.error);
            }
            else {
                resolve(body);
            }
        })
    })
}

/**
 * Subscribe to messages on the facebook page to this application server
 * */
function doSubscribe(controller) {
    // subscribe to page events
    request.post(MESSENGER_API_HOST + MESSENGER_SUBSCRIBE_ENDPOINT.replace("$", MESSENGER_PAGE_ACCESS_TOKEN),
        function (err, res, body) {
            if (err) {
                controller.log('Could not subscribe to facebook page messages');
                controller.log(err);
            }
            else {
                // controller.log('Subscribing to Facebook Events:', body);
                controller.startTicking(); // start ticking to send conversation messages
            }
        }
    );
}

/**
 * Format the date to ISO date format
 * */
function getFormattedDate() {
    let date = new Date().toISOString();
    date = date.substring(0, date.length - 1);
    return date;
}

/**
 * Generate alphanumeric random string
 * */
function getRandomString(str) {
    return randomstring.generate({
            length: 12,
            charset: 'alphanumeric'
        }) + str
}

/**
 * Send query request to NLP agent (Used to trigger specific intents)
 * */
function sendQueryToNlpAgent(sessionId, text) {

    return new Promise((resolve, reject) => {

        try {
            let options = {
                method: 'POST',
                url: NLP_AGENT_HOST + NLP_QUERY_ENDPOINT,
                headers: {
                    authorization: 'Bearer ' + APIAI_ACCESS_TOKEN,
                    'content-type': 'application/json',
                    accept: 'application/json'
                },
                body: {
                    "query": text,
                    "lang": "en",
                    "sessionId": sessionId
                },
                json: true
            };

            request(options, (error, response, body) => {
                if (error) {
                    console.error("Error sending query to NLP Agent: ");
                    reject(error);
                }
                else {
                    resolve(body);
                }
            });

        }
        catch (error) {
            console.error("Error sending query to NLP Agent: ");
            console.error(error);
            reject(error);
        }
    });
}

/**
 * Format the date to ISO Date
 * */
function sendTypingOnIndicatorsToMessenger(senderID) {

    return new Promise((resolve, reject) => {

        try {
            let options = {
                uri: MESSENGER_API_BASE_URL + MESSENGER_MESSAGES_ENDPOINT,
                qs: {access_token: MESSENGER_PAGE_ACCESS_TOKEN},
                method: 'POST',
                json: {
                    recipient: {
                        id: senderID
                    },
                    sender_action: "typing_on"
                }
            };

            request(options, function (error, response, body) {

                if (!error && response.statusCode == httpStatus.OK)
                    resolve({statusCode: response.statusCode});
                else {
                    console.error("Error sending Typing On Indicators to Messenger: ", response.statusCode, response.statusMessage, body.error);
                    reject(error)
                }
            });
        }
        catch (error) {
            console.error("Error sending Typing On Indicators to Messenger.");
            console.error(error);
            reject(error);
        }
    });
}

/**
 * POST response to Messenger
 * */
function sendMessageToMessenger(messageData) {

    return new Promise((resolve, reject) => {
        try {
            let options = {
                uri: MESSENGER_API_BASE_URL + MESSENGER_MESSAGES_ENDPOINT,
                qs: {access_token: MESSENGER_PAGE_ACCESS_TOKEN},
                method: 'POST',
                json: messageData
            };

            request(options, function (error, response, body) {

                if (!error && response.statusCode == httpStatus.OK) {
                    let recipientId = body.recipient_id;
                    console.log("Successfully sent message to recipient %s", recipientId);
                    resolve({statusCode: response.statusCode});

                } else {
                    // console.trace(body.error);
                    console.error("Failed sending message to Messenger Send API", response.statusCode, response.statusMessage, body.error);
                    reject(error);
                }
            });
        }
        catch (error) {
            console.error("Failed sending message to Messenger Send API");
            console.error(error);
            reject(error);
        }
    });
}

/**
 * Convert Timestamp to user's timezone and return formatted date and time
 * */
function convertTimeToUsersTimezone(userTimezone, timestamp) {
    try {
        let timezone = Number.parseInt(userTimezone);
        let convertedTime = moment.utc(timestamp).utcOffset(timezone);
        let date = convertedTime.format('MM/DD/YYYY');
        let time = convertedTime.format('h:m A');

        return {
            date,
            time
        }
    }
    catch (error) {
        console.error("Error converting user's timezone to UTC");
        return error;
    }
}

/**
 * Encrypt message using RSA Public key
 * */
function encryptRSA(msg) {

    return new Promise((resolve, reject) => {
        try {
            console.log("\nEncrypting message using Public Key");
            let publicKey = ursa.createPublicKey(fs.readFileSync(publicKeyFilePath));
            let response = publicKey.encrypt(msg, 'utf8', 'base64', ursa.RSA_PKCS1_PADDING);
            console.log('encrypted message: ', response, '\n');
            msg = null;     // delete secret message after successful encryption
            resolve(response);
        }
        catch (error) {
            msg = null;     // delete secret message after successful encryption
            console.log("Error encrypting key");
            console.log(error);
            reject(error);
        }
    });
}

/**
 * Decrypt message using RSA Private key
 * */
function decryptRSA(msg) {

    return new Promise((resolve, reject) => {

        try {
            let privateKey = ursa.createPrivateKey(fs.readFileSync(privateKeyFilePath));

            resolve(privateKey.decrypt(msg, 'base64', 'utf8', ursa.RSA_PKCS1_PADDING));
        }
        catch (error) {
            console.log("Error decrypting key");
            console.log(error);
            reject(error);
        }
    });
}


function getFileFromURL(url) {

    return new Promise((resolve, reject) => {
        try {
            console.log("Reading file from url: " + url);

            request.get(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    let file = body;
                    console.log({file});
                    resolve(file);
                }
                else
                    throw new Error(error);
            });
        }
        catch (error) {
            console.log("Error reading file from URL.");
            console.log(error);
            reject(error);
        }
    });
}

function getRandomNumber(range) {
    return Math.floor(Math.random() * range);
}

function simulateTransaction(body) {

    return new Promise((resolve, reject) => {

        try {
            console.log("Simulating Transaction using Auth Decision API.");

            if (!isDefined(body))
                throw new Error("Request body cannot be empty.");
            else {
                let options = {
                    method: 'POST',
                    url: CTC_HOST + CTC_AUTH_DECISION_ENDPOINT,
                    headers: {
                        "content-type": 'application/json',
                        "accept": 'application/json',
                        "on-behalf-of": BANK_IDENTIFIER
                    },
                    body: body,
                    json: true
                };

                request(options, (error, response) => {
                    if (error) {
                        console.log("Error in Auth Decision API.");
                        reject(error);
                    }
                    else{
                        console.log(response.body);
                        resolve({
                            statusCode : response.statusCode,
                            response: response.body
                        });
                    }

                });
            }
        }
        catch (error) {
            console.error("\nError simulating transaction using Auth Decision API.");
            reject(error);
        }
    });
}