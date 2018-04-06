/**
 * Created by mayujain on 7/12/17.
 */

/* eslint-disable camelcase */

const express = require('express');
const router = express.Router();
const httpStatus = require('http-status');
const request = require('request');
const _ = require('underscore');
const config = require('../resources/configuration.json');

const app = require('../main');
const controller = app.get('controller');
const bot = app.get('bot');
const KeyStore = app.get('KeyStore');
const utilities = require('../utilities');

const cardEnrollment = require('./cardEnrollment');
const notifications = require('../actions/transaction.notifications.js');
const initController = require('./initDB');
const userInterface = require('../db/userInterface');
const receiveEventHandlers = require('../handlers/msg.receive.handlers/receive.index.js');
const encryption = require('./encryption');

const MESSENGER_VALIDATION_TOKEN = KeyStore.get('MESSENGER_VALIDATION_TOKEN');
const MESSENGER_APP_SECRET = KeyStore.get('MESSENGER_APP_SECRET');
const MESSENGER_APP_ID = KeyStore.get('MESSENGER_APP_ID');
const MESSENGER_PAGE_ID = KeyStore.get('MESSENGER_PAGE_ID');
const DEBUG_API_ENABLED = config['DEBUG_API_ENABLED'];
const IMAGE_LOGO = config['IMAGE_URLS']['BANK_LOGO'];
const IMAGE_ENROLL_PAGE = config['IMAGE_URLS']['ENROLL_PAGE'];
const TC_PAGE_URL = config['TC_PAGE_URL'];

// root
router.get('/', (req, res) => {
    res.render('index', {
        MESSENGER_APP_ID,
        MESSENGER_PAGE_ID
    });
});

//terms And Privacy
router.get('/terms', (req, res) => {

    if (TC_PAGE_URL !== '')
        res.redirect(TC_PAGE_URL);
    else
        res.render('termsAndPrivacy');
});

// Frequently asked questions page
router.get('/faqs', (req, res) => {
    res.render('faqs');
});

/*
 * Use your own validation token. Check that the token used in the Webhook
 * setup is the same token used here.
 */
router.get('/webhook', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === MESSENGER_VALIDATION_TOKEN) {
        console.log("Validating webhook");
        res.status(httpStatus.OK).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(httpStatus.UNAUTHORIZED);
    }
});

/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your router to your page to receive callbacks
 * for your page.
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_router
 */
router.post('/webhook', (req, res) => {
    let data = req.body;

    // Make sure this is a page subscription
    if (data.object == 'page') {

        // Iterate over each entry
        // There may be multiple if batched
        data.entry.forEach(function (pageEntry) {
            let pageID = pageEntry.id;
            let timeOfEvent = pageEntry.time;

            // Iterate over each messaging event
            pageEntry.messaging.forEach(function (messagingEvent) {

                if (messagingEvent.optin) {
                    receiveEventHandlers.receivedAuthentication(messagingEvent);
                }
                else if (messagingEvent.message) {
                    receiveEventHandlers.receivedMessage(messagingEvent);
                }
                else if (messagingEvent.delivery) {
                    receiveEventHandlers.receivedDeliveryConfirmation(messagingEvent);
                }
                else if (messagingEvent.postback) {
                    receiveEventHandlers.receivedPostback(messagingEvent);
                }
                else if (messagingEvent.account_linking) {
                    receiveEventHandlers.receivedAccountLink(messagingEvent);
                }
                else if (messagingEvent.read) {

                    let message = {
                        read: messagingEvent.read,
                        user: messagingEvent.sender.id,
                        channel: messagingEvent.sender.id,
                        page: messagingEvent.recipient.id,
                        timestamp: messagingEvent.timestamp,
                    };
                    controller.trigger('message_read', [bot, message]);

                }
                else if (messagingEvent.referral) {

                    let message = {
                        user: messagingEvent.sender.id,
                        channel: messagingEvent.sender.id,
                        page: messagingEvent.recipient.id,
                        timestamp: messagingEvent.timestamp,
                        referral: messagingEvent.referral,
                    };
                    controller.trigger('facebook_referral', [bot, message]);

                }
                else {
                    console.log("Webhook received unknown messagingEvent: ", messagingEvent);
                }
            });
        });

        // You must send back a 200, within 20 seconds, to let us know you've
        // successfully received the callback. Otherwise, the request will time out.
        res.sendStatus(httpStatus.OK);
    }
});

/*
 * This path is used for account linking. The account linking call-to-action
 * (sendAccountLinking) is pointed to this URL.
 */
router.get('/authorize', (req, res) => {
    let accountLinkingToken = req.query.account_linking_token;
    let redirectURI = req.query.redirect_uri;

    // Authorization Code should be generated per user by the developer. This will be passed to the Account Linking callback.
    let authCode = "1234567890";

    // Redirect users to this URI on successful login
    let redirectURISuccess = redirectURI + "&authorization_code=" + authCode;

    res.render('authorize', {
        accountLinkingToken: accountLinkingToken,
        redirectURI: redirectURI,
        redirectURISuccess: redirectURISuccess
    });
});

/*
 * Render web-view for card enrollment
 */
router.get('/enroll/:senderID', (req, res) => {

    const senderID = req.params.senderID;

    userInterface
        .findUser(senderID)
        .then(user => {
            if (!user || user == null)
                res.render('enroll', {
                    FBUSERID: senderID,
                    IMAGE_LOGO: IMAGE_LOGO,
                    IMAGE_ENROLL_PAGE: IMAGE_ENROLL_PAGE
                });
            else
                res.render('alreadyEnrolled', {});
        })
        .catch(err => {
            console.log(err);
            res.render('enroll', {});
        });
});

/*
 * Verify card details from web-view and enroll card.
 */
router.post('/verify', (req, res) => {
    cardEnrollment.enrollCard(req.body, res);
});

/*
 * Send transaction alert to facebook user
 */
router.post('/notification/callback', (req, res) => {

    _.each(req.body.alerts, (alert) => {
        notifications.sendAlert(alert);
    });

    res.status(httpStatus.OK).send('OK');
});

/*
 * Initialize the MySql DB forcefully
 * */
router.get('/sync/db', async(req, res) => {

    if (DEBUG_API_ENABLED && req.headers.access_code == MESSENGER_APP_SECRET) {

        try {
            const response = await initController.initializeDataBaseForceFully(req, res);
            res.status(httpStatus.OK).send(response);
        }
        catch (error) {
            res.status(httpStatus.BAD_REQUEST).send(error)
        }
    }
    else
        res.status(httpStatus.FORBIDDEN).send({success: false, error: "Invalid headers."})

});

router.post('/encrypt', (req, res) => {

    if (DEBUG_API_ENABLED)
        encryption.encryptMessage(req, res);
    else
        res.status(httpStatus.FORBIDDEN).send("DEBUG API not enabled from config.");
});

router.post('/decrypt', (req, res) => {

    if (DEBUG_API_ENABLED)
        encryption.decryptMessage(req, res);
    else
        res.status(httpStatus.FORBIDDEN).send("DEBUG API not enabled from config.");
});

router.post('/simulate/transactions', async(req, res) => {

    if (DEBUG_API_ENABLED) {
        try {
            const response = await utilities.simulateTransaction(req.body);
            res.status(httpStatus.OK).send(response);
        }
        catch (error) {
            res.status(httpStatus.BAD_REQUEST).send(error);
        }
    }
    else
        res.status(httpStatus.FORBIDDEN).send("DEBUG API not enabled from config.");
});

module.exports = router;