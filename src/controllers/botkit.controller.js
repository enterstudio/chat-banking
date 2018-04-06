/**
 * Created by mayujain on 7/18/17.
 */

const templates = require('../messages');
const utilities = require('../utilities');

let app = require('../main');
let controller = app.get('controller');

const disconnectAccount = require('../actions/account.disconnect.js');
const alertSettings = require('../actions/alert.controls.js');
const notifications = require('../actions/transaction.notifications');
const accountInfo = require('../actions/account.info');
const msgFormat = require('../handlers/msg.send.handlers/msg.send');
const getStarted = require('../actions/get.started');
const travelNotifications = require('../actions/travel.notification.controls.js');
const config = require('../resources/configuration.json');
const TRANSACTION_ALERTS = config['TRANSACTION_ALERTS'];
const ACCOUNT_INFORMATION = config['ACCOUNT_INFORMATION'];
const ACCOUNT_BALANCE = config['ACCOUNT_BALANCE'];
const TRANSACTION_HISTORY = config['TRANSACTION_HISTORY'];
const TRAVEL_NOTIFICATIONS = config['TRAVEL_NOTIFICATIONS'];
const CREATE_TRAVEL_NOTIFICATIONS = config['CREATE_TRAVEL_NOTIFICATIONS'];
const GET_TRAVEL_NOTIFICATIONS = config['GET_TRAVEL_NOTIFICATIONS'];
const UPDATE_TRAVEL_NOTIFICATIONS = config['UPDATE_TRAVEL_NOTIFICATIONS'];
const ContentManager = require('../content/ContentManager');

utilities.doSubscribe(controller);

// this is triggered when a user clicks the send-to-messenger plugin
controller.on('facebook_optin', function (bot, message) {
    getStarted.sendWelcomeMessage(message.user);
});


// this is triggered when a user clicks any postback buttons
controller.on('facebook_postback', async function (bot, message, userContext) {

    let userId = userContext.getUserId();

    switch (message.payload) {

        case 'Get Started':
            getStarted.sendWelcomeMessage(userId);
            break;

        case 'Menu':
            templates.sendMainMenu(userContext);
            break;

        case 'MANAGE_ALERTS':
            if (TRANSACTION_ALERTS)
                alertSettings.manageAlerts(userId);
            break;

        case  'TURN_OFF_ALL_NOTIFICATIONS':
            if (TRANSACTION_ALERTS)
                alertSettings.muteAlerts(userId);
            break;

        case  'TURN_ON_ALL_NOTIFICATIONS':
            if (TRANSACTION_ALERTS)
                alertSettings.unmuteAlerts(userContext);
            break;

        case 'SHOW_ALERT_SETTINGS':
            if (TRANSACTION_ALERTS)
                alertSettings.getAlertSettings(userContext);
            break;

        case  'CHANGE_NOTIFICATION_PREFERENCES':
            if (TRANSACTION_ALERTS)
                alertSettings.changeAlertPreferences(userContext);
            break;

        case 'DISCONNECT_ACCOUNT':
            disconnectAccount.triggerDisconnectAccountIntent(userContext);
            break;

        case 'SHOW_OPTIONS':
            templates.sendShowOptions(userContext);
            break;

        case 'CONTACT_BANK':
            templates.sendContactBank(userContext);
            break;

        case 'MODIFY_GLOBAL_ALERT_AMOUNT':
            if (TRANSACTION_ALERTS)
                templates.sendChangeAlertAmountQuickReply(userContext);
            break;

        case 'SET_ALERT_ON_CATEGORY':
            if (TRANSACTION_ALERTS)
                templates.sendSetCategoryAlertQuickReplyOptions(userContext);
            break;

        case 'GET_ACCOUNT_INFO':
            if (ACCOUNT_INFORMATION)
                templates.sendDCASMenu(userContext);
            break;

        case 'GET_ACCOUNT_BALANCE':
            if (ACCOUNT_BALANCE)
                accountInfo.getAccountBalance(userContext);
            break;

        case 'GET_RECENT_TRANSACTIONS':
            if (TRANSACTION_HISTORY) {
                const contentManager = new ContentManager();
                await contentManager.loadContent(userContext.getLocale());
                msgFormat.sendTextMessage(userId, contentManager.getValue("featureComingSoon"));
            }
            break;

        case 'TRAVEL_NOTIFICATIONS_MENU':
            if (TRAVEL_NOTIFICATIONS)
                templates.sendTravelNotificationsMenu(userContext);
            break;

        case 'NOTIFY_BANK_OF_TRAVEL':
            if (CREATE_TRAVEL_NOTIFICATIONS)
                travelNotifications.triggerTravelNotificationIntent(userContext);
            break;

        case 'VIEW_TRAVEL_NOTIFICATIONS':
            if (GET_TRAVEL_NOTIFICATIONS)
                travelNotifications.getTravelNotifications(userContext);
            break;

        case 'UPDATE_TRAVEL_NOTIFICATIONS':
            if (UPDATE_TRAVEL_NOTIFICATIONS) {
                const contentManager = new ContentManager();
                await contentManager.loadContent(userContext.getLocale());
                msgFormat.sendTextMessage(userId, contentManager.getValue("featureComingSoon"));
            }
            break;
    }

    let payload = message.payload.split(/\s*_/);

    if (payload && payload.length > 2) {

        if (payload[0] == "SEND" && payload[1] == "ALERT") {
            notifications.sendAlertDetails(userContext, payload[2]);
        }
    }
});


