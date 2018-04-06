/**
 * Created by mayujain on 7/18/17.
 */

const request = require('request');
const _ = require('underscore');
const uuid = require('node-uuid');
const config = require('../resources/configuration.json');

const utilities = require('../utilities');
const app = require('../main');
const KeyStore = app.get('KeyStore');
const templates = require('../messages');
const disconnectAccountAction = require('../actions/account.disconnect');
const alertSettings = require('../actions/alert.controls.js');
const accountInfo = require('../actions/account.info');
const msgFormat = require('../handlers/msg.send.handlers/msg.send');
const travelNotifications = require('../actions/travel.notification.controls.js');
const NLPAgent = require('../NlpAgent');
const TRANSACTION_ALERTS = config['TRANSACTION_ALERTS'];
const ACCOUNT_INFORMATION = config['ACCOUNT_INFORMATION'];
const ACCOUNT_BALANCE = config['ACCOUNT_BALANCE'];
const TRANSACTION_HISTORY = config['TRANSACTION_HISTORY'];
const TRAVEL_NOTIFICATIONS = config['TRAVEL_NOTIFICATIONS'];
const CREATE_TRAVEL_NOTIFICATIONS = config['CREATE_TRAVEL_NOTIFICATIONS'];
const GET_TRAVEL_NOTIFICATIONS = config['GET_TRAVEL_NOTIFICATIONS'];
const UPDATE_TRAVEL_NOTIFICATIONS = config['UPDATE_TRAVEL_NOTIFICATIONS'];
const ContentManager = require('../content/ContentManager');

module.exports = {
    processEvent: processEvent
};

function processEvent(facebook_message, userContext) {
    let text = facebook_message.text;
    let senderID = facebook_message.user;

    let nlpAgent = new NLPAgent(senderID);
    let apiaiRequest = nlpAgent.sendTextToAgent(text);

    apiaiRequest.on('response', async(response) => {
        if (utilities.isDefined(response.result)) {
            let apiIntent = response.result;

            console.log(JSON.stringify(apiIntent, null, 4));

            let responseText = apiIntent.fulfillment.speech;
            let action = apiIntent.action;
            let parameters = apiIntent.parameters;
            let context = apiIntent.contexts;
            let metadata = apiIntent.metadata;

            switch (action) {

                case 'show_menu':
                    templates.sendMainMenu(userContext);
                    break;

                case 'set.transaction.alert':
                    if (TRANSACTION_ALERTS) {
                        if (apiIntent.actionIncomplete == false)
                            alertSettings.setTransactionAlert(senderID, parameters, context);
                        else
                            alertSettings.promptForAmountWithQuickReply(userContext, context, parameters);
                    } else
                        templates.sendUnsupportedRequest(userContext);
                    break;

                case 'mute.transaction.alerts':
                    if (TRANSACTION_ALERTS && apiIntent.actionIncomplete == false)
                        alertSettings.muteAlerts(senderID);
                    else
                        templates.sendUnsupportedRequest(userContext);
                    break;

                case 'unmute.transaction.alerts':
                    if (TRANSACTION_ALERTS && apiIntent.actionIncomplete == false)
                        alertSettings.unmuteAlerts(userContext);
                    else
                        templates.sendUnsupportedRequest(userContext);
                    break;

                case 'modify.transaction.alert.preferences':
                    if (TRANSACTION_ALERTS && apiIntent.actionIncomplete == false)
                        alertSettings.manageAlerts(senderID);
                    else
                        templates.sendUnsupportedRequest(userContext);
                    break;

                case 'show.alert.settings':
                    if (TRANSACTION_ALERTS && apiIntent.actionIncomplete == false)
                        alertSettings.getAlertSettings(userContext);
                    else
                        templates.sendUnsupportedRequest(userContext);
                    break;

                case 'change.alert.amount':
                    if (TRANSACTION_ALERTS && apiIntent.actionIncomplete == false)
                        templates.sendChangeAlertAmountQuickReply(userContext);
                    else
                        templates.sendUnsupportedRequest(userContext);
                    break;

                case 'show.alert.categories':
                    if (TRANSACTION_ALERTS && apiIntent.actionIncomplete == false)
                        templates.sendSetCategoryAlertQuickReplyOptions(userContext);
                    else
                        templates.sendUnsupportedRequest(userContext);
                    break;

                case 'show.more.alert.categories':
                    if (TRANSACTION_ALERTS && apiIntent.actionIncomplete == false)
                        templates.sendShowMoreCategoriesQuickReply(userContext);
                    else
                        templates.sendUnsupportedRequest(userContext);
                    break;

                case 'no.change.alerts':
                    if (TRANSACTION_ALERTS && apiIntent.actionIncomplete == false)
                        templates.sendKeepNotificationsOff(userContext);
                    else
                        templates.sendUnsupportedRequest(userContext);
                    break;

                case 'start.customize.alert.settings.flow':
                    if (TRANSACTION_ALERTS && apiIntent.actionIncomplete == false)
                        alertSettings.changeAlertPreferences(userContext);
                    else
                        templates.sendUnsupportedRequest(userContext);
                    break;

                case 'dispute.transaction':
                    if (TRANSACTION_ALERTS && apiIntent.actionIncomplete == false)
                        templates.sendCustomerSupportDetails(userContext);
                    else
                        templates.sendUnsupportedRequest(userContext);
                    break;

                case 'delete.transaction.alert':
                    if (TRANSACTION_ALERTS && apiIntent.actionIncomplete == false)
                        alertSettings.removeTransactionAlert(userContext, context);
                    else
                        templates.sendUnsupportedRequest(userContext);
                    break;

                case 'get.account.information':
                    if (ACCOUNT_INFORMATION && apiIntent.actionIncomplete == false)
                        templates.sendDCASMenu(userContext);
                    else
                        templates.sendUnsupportedRequest(userContext);
                    break;

                case 'get.account.balance':
                    if (ACCOUNT_BALANCE && apiIntent.actionIncomplete == false)
                        accountInfo.getAccountBalance(userContext);
                    else
                        templates.sendUnsupportedRequest(userContext);
                    break;

                case 'create.travel.notification':
                    if (TRAVEL_NOTIFICATIONS && CREATE_TRAVEL_NOTIFICATIONS && apiIntent.actionIncomplete == false)
                        travelNotifications.createTravelNotification(userContext, context, parameters);
                    else
                        templates.sendUnsupportedRequest(userContext);
                    break;

                case 'trigger.travel.notification':
                    if (TRAVEL_NOTIFICATIONS && CREATE_TRAVEL_NOTIFICATIONS && apiIntent.actionIncomplete == false)
                        travelNotifications.triggerTravelNotificationIntent(userContext);
                    else
                        templates.sendUnsupportedRequest(userContext);
                    break;

                case 'see.travel.notice':
                    if (TRAVEL_NOTIFICATIONS && GET_TRAVEL_NOTIFICATIONS && apiIntent.actionIncomplete == false)
                        travelNotifications.getTravelNotifications(userContext);
                    else
                        templates.sendUnsupportedRequest(userContext);
                    break;

                case 'update.travel.notification':
                    if (TRAVEL_NOTIFICATIONS && UPDATE_TRAVEL_NOTIFICATIONS && apiIntent.actionIncomplete == false) {
                    }
                    // travelNotifications.createTravelNotification(senderID, context, parameters);
                    else
                        templates.sendUnsupportedRequest(userContext);
                    break;

                case 'confirm.account.disconnect':
                    if (apiIntent.actionIncomplete == false)
                        disconnectAccountAction.confirmedDisconnectAccount(senderID);
                    else
                        templates.sendUnsupportedRequest(userContext);
                    break;

                case 'cancel.account.disconnect':
                    if (apiIntent.actionIncomplete == false)
                        disconnectAccountAction.cancelDisconnectAccount(userContext);
                    else
                        templates.sendUnsupportedRequest(userContext);
                    break;

                case 'add.another.card.to.messenger':
                    if (apiIntent.actionIncomplete == false)
                        msgFormat.sendTextMessage(senderID, apiIntent.fulfillment.messages[0].speech);
                    else
                        templates.sendUnsupportedRequest(userContext);
                    break;

                case 'send.options.button':
                    if (apiIntent.actionIncomplete == false) {
                        const contentManager = new ContentManager();
                        await contentManager.loadContent(userContext.getLocale());
                        templates.sendShowOptions(userContext, contentManager.getValue("optionsTextMessage"));
                    }
                    else
                        templates.sendUnsupportedRequest(userContext);
                    break;

                case 'send.thumbsup.emoji':
                    if (apiIntent.actionIncomplete == false)
                        templates.sendThumbsUpAndMenu(userContext);
                    break;

                case 'send.joke':
                    if (apiIntent.actionIncomplete == false)
                        templates.sendJokeMessage(userContext);
                    break;

                case 'input.unknown':
                    templates.sendUnsupportedRequest(userContext);
                    break;

                default:
                    if (responseText == "Confirm Itinerary?")
                        travelNotifications.showItineraryAndConfirmation(userContext, context);

                    else if (responseText == "askDisconnectConfirmation")
                        disconnectAccountAction.askDisconnectConfirmation(userContext, context);

                    else if (metadata.intentName == "create.travel.notification") {
                        if (TRAVEL_NOTIFICATIONS)
                            msgFormat.sendTextMessage(senderID, responseText);
                        else
                            templates.sendUnsupportedRequest(userContext);
                    }

                    else if (responseText != "")
                        msgFormat.sendTextMessage(senderID, responseText);
                    else
                        templates.sendUnsupportedRequest(userContext);

                    break;
            }
        }
    });

    apiaiRequest.on('error', error => {
        console.error("Error with NLP request.");
        console.error(error);
    });
    apiaiRequest.end();
}
