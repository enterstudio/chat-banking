/**
 * Created by mayujain on 7/13/17.
 */

'use strict';

const request = require('request');
let app = require('../main');
let KeyStore = app.get('KeyStore');
const SERVER_URL = KeyStore.get('SERVER_URL');
const MESSENGER_PAGE_ACCESS_TOKEN = KeyStore.get('MESSENGER_PAGE_ACCESS_TOKEN');

const config = require('../resources/configuration.json');
const MESSENGER_API_BASE_URL = config['MESSENGER_API']['HOST'] + config['MESSENGER_API']['VERSION'];
const MESSENGER_PROFILE_ENDPOINT = config['MESSENGER_API']['PROFILE_ENDPOINT'];
const MESSENGER_THREAD_SETTINGS_ENDPOINT = config['MESSENGER_API']['THREAD_SETTINGS_ENDPOINT'];
const TRANSACTION_ALERTS = config['TRANSACTION_ALERTS'];
const ACCOUNT_INFORMATION = config['ACCOUNT_INFORMATION'];
const ACCOUNT_BALANCE = config['ACCOUNT_BALANCE'];
const TRANSACTION_HISTORY = config['TRANSACTION_HISTORY'];
const TRAVEL_NOTIFICATIONS = config['TRAVEL_NOTIFICATIONS'];
const GREETINGS_MESSAGE = config['GREETINGS'];

//Show "Get Started" on start
request({
    url: MESSENGER_API_BASE_URL + MESSENGER_PROFILE_ENDPOINT,
    qs: {access_token: MESSENGER_PAGE_ACCESS_TOKEN},
    method: 'POST',
    json: {
        "get_started": {
            "payload": "Get Started"
        }
    }
}, (error, response) => {
    if (error)
        console.log('\nError setting Get Started thread: ', error);
    else if (response.body.error)
        console.log('\nError setting Get Started thread: ', response.body.error);
    else {
        console.log("\nRegistered Get Started thread on Facebook. ");
        console.log(response.body);
    }
});

//CREATE Persistent Menu
async function setupPersistentMenu() {

    let menuItems = [];

    if (ACCOUNT_INFORMATION && ACCOUNT_BALANCE && TRANSACTION_HISTORY) {
        menuItems.push({
            "title": "Account Information",
            "type": "postback",
            "payload": "GET_ACCOUNT_INFO"
        });
    }
    else if (ACCOUNT_INFORMATION && ACCOUNT_BALANCE) {
        menuItems.push({
            "title": "View Balance",
            "type": "postback",
            "payload": "GET_ACCOUNT_BALANCE"
        });
    }

    if (TRAVEL_NOTIFICATIONS) {
        menuItems.push({
            "title": "Set Travel Notice",
            "type": "postback",
            "payload": "TRAVEL_NOTIFICATIONS_MENU"
        });
    }

    if (TRANSACTION_ALERTS) {
        menuItems.push({
            "title": "Manage Notifications",
            "type": "postback",
            "payload": "MANAGE_ALERTS"
        });
    }

    menuItems.push({
        "title": "Disconnect Card",
        "type": "postback",
        "payload": "DISCONNECT_ACCOUNT"
    });

    request({
            url: MESSENGER_API_BASE_URL + MESSENGER_PROFILE_ENDPOINT,
            qs: {access_token: MESSENGER_PAGE_ACCESS_TOKEN},
            method: 'POST',
            json: {
                "persistent_menu": [
                    {
                        "locale": "default",
                        "call_to_actions": [
                            {
                                "title": "Options",
                                "type": "nested",
                                "call_to_actions": menuItems
                            },
                            {
                                "title": "Help",
                                "type": "nested",
                                "call_to_actions": [
                                    {
                                        "title": "FAQs",
                                        "type": "web_url",
                                        "webview_height_ratio": "tall",
                                        "webview_share_button": "hide",
                                        "messenger_extensions": true,
                                        "url": SERVER_URL + "/faqs"
                                    },
                                    {
                                        "title": "Contact Bank",
                                        "type": "postback",
                                        "payload": "CONTACT_BANK"
                                    }
                                ]
                            },
                            {
                                "title": "Terms & Privacy",
                                "type": "web_url",
                                "webview_height_ratio": "tall",
                                "webview_share_button": "hide",
                                "messenger_extensions": true,
                                "url": SERVER_URL + "/terms"
                            }
                        ]
                    }
                ]
            }
        },
        (error, response) => {
            if (error) {
                console.log('Error in Persistent Menu: ', error)
            } else if (response.body.error) {
                console.log('Error in Persistent Menu: ', response.body.error)
            }
            console.log(`\nRegistered Persistent Menu on Messenger App.`);
            console.log(response.body);
        }
    );
}

//Whitelist your Sever Domain for Adding Messenger Extensions on web view page
request({
    url: MESSENGER_API_BASE_URL + MESSENGER_PROFILE_ENDPOINT,
    qs: {access_token: MESSENGER_PAGE_ACCESS_TOKEN},
    method: 'POST',
    json: {
        "whitelisted_domains": [SERVER_URL]
    }
}, (error, response) => {
    if (error)
        console.log('Error in Whitelisting Domain ${SERVER_URL} : ', error);
    else if (response.body.error)
        console.log('Error in Whitelisting Domain ${SERVER_URL} : ', response.body.error);
    else
        console.log(`\nWhitelisted URL ${SERVER_URL} on Messenger App.`);
});

async function setupGreetingText() {

    request({
        url: MESSENGER_API_BASE_URL + MESSENGER_THREAD_SETTINGS_ENDPOINT,
        qs: {access_token: MESSENGER_PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            "setting_type": "greeting",
            "greeting": {
                "text": GREETINGS_MESSAGE
            }
        }
    }, (error, response) => {
        if (error)
            console.log('Error setting up Greeting Text : ', error);
        else if (response.body.error)
            console.log('Error setting up Greeting Text : ', response.body.error);
        else {
            console.log(`\nRegistered Greeting Text on Messenger App.`);
            console.log(response.body);
        }
    });
}

setupPersistentMenu();

setupGreetingText();