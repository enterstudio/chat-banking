/**
 * Created by mayujain on 8/12/17.
 */

const emoji = require('node-emoji');
const ctcSDK = require('../apiSdk/ctcSdk');
const templates = require('../messages');
const msgFormat = require('../handlers/msg.send.handlers/msg.send');
const _ = require('underscore');
const userInterface = require('../db/userInterface');
const httpStatus = require('http-status');
const merchantCategories = require('../resources/merchantCategories');
const ContentManager = require('../content/ContentManager');
const UserContext = require("../models/UserContext");
const utilities = require('../utilities');

const setTransactionAlert = async(userId, parameters, contexts) => {

    let alert = {
        amount: 0.01,
        type: "global"
    };

    //get document_id and user_id from database
    const user = await userInterface.findUser(userId);

    if (user && user.user_id !== undefined) {

        let contentManager = new ContentManager();
        await contentManager.loadContent(user.locale);
        let userContext = new UserContext(userId, user.locale);

        alert.user_id = user.user_id;
        alert.ctc_document_id = user.ctc_document_id;

        try {
            if (contexts && contexts !== "") {

                _.each(contexts, (context) => {

                    if (context.name === "set-alert") {
                        let parameters = context.parameters;

                        if (parameters.amount.amount && parameters.amount.amount !== "") {
                            alert.amount = parameters.amount.amount;
                        }

                        else if (parameters.amount !== "") {
                            alert.amount = parameters.amount;
                        }

                        if (utilities.isDefined(parameters.merchant_type) && parameters.merchant_type.length > 0) {
                            alert.type = "merchant";
                            alert.merchant_type = parameters.merchant_type;
                        }
                    }
                });
            }

            if (alert.amount <= 0) {
                msgFormat.sendTextMessage(userId, contentManager.getValue("alertAmountErrorMessage1"));
            } else {
                //create alert
                const alertResponse = await ctcSDK.updateAlert(alert);
                if (alertResponse && alertResponse.statusCode == httpStatus.OK) {

                    //update notifications flag in DB
                    user.notifications = true;

                    await userInterface.saveOrUpdateUser(user);

                    if (utilities.isDefined(parameters.merchant_type) && parameters.merchant_type.length > 0) {
                        templates.sendSetAlertConfirmationForMCC(userContext, alert.amount, merchantCategories[alert.merchant_type], user.first_name);
                    }
                    else {
                        templates.sendSetAlertConfirmation(userContext, alert.amount);
                    }
                }
            }
        }
        catch (error) {
            console.log(error);
            templates.sendSystemErrorMessage(userContext);
        }
    }
};

/**
 * Show alert settings
 * */
const showExistingAlertSettings = async(user, senderID, contentManager, callback) => {

    let response = await ctcSDK.getAlerts(user);
    response = JSON.parse(response.response);

    if (response && response.data) {

        let alerts = response.data;

        _.each(alerts, (alert) => {

            if (alert.alert_type == "global" && alert.amount_limit != undefined) {

                if (alert.amount_limit > 0.01)
                    msgFormat.sendTextMessage(senderID, contentManager.getValue("alertSettingMessage1").replace("{{$0}}", alert.amount_limit));
                else
                    msgFormat.sendTextMessage(senderID, contentManager.getValue("alertSettingMessage2"));
            }
        });

        if (alerts.length > 1) {
            let message = contentManager.getValue("alertSettingMessage3");

            _.each(alerts, (alert) => {
                if (alert.merchant_type) {
                    message = message + `\n$${alert.amount_limit} on ${merchantCategories[alert.merchant_type]} \n`
                }
            });
            setTimeout(() => {
                msgFormat.sendTextMessage(senderID, message);
                callback();
            }, 900);
        }
        else callback();
    }
    else throw new Error("Error fetching alert settings.");
};

const getAlertSettings = async(userContext) => {

    let senderID = userContext.getUserId();
    const contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    try {
        const user = await userInterface.findUser(senderID);
        if (user && user.user_id !== undefined) {

            if (user.notifications) {
                showExistingAlertSettings(user, senderID, contentManager, () => {
                    setTimeout(() => {
                        templates.sendShowOptions(userContext);
                    }, 1200);
                });
            }
            else
                templates.sendTurnAlertsOnButton(userContext);
        }
    }
    catch (error) {
        console.log(error);
        templates.sendSystemErrorMessage(userContext);
    }
};

const manageAlerts = async(senderID) => {

    const user = await userInterface.findUser(senderID);

    let userContext = new UserContext(senderID, user.locale);

    if (user && user.notifications == true) {
        templates.sendManageNotificationsMenu1(userContext);
    }
    else if (user && user.notifications == false) {
        templates.sendManageNotificationsMenu2(userContext);
    }
};

const muteAlerts = async(senderID) => {

    const user = await userInterface.findUser(senderID);

    if (user && user !== null) {
        let userContext = new UserContext(senderID, user.locale);

        user.notifications = false;
        let updateResponse = await userInterface.saveOrUpdateUser(user);

        let contentManager = new ContentManager();
        await contentManager.loadContent(userContext.getLocale());

        if (updateResponse.notifications == false) {

            msgFormat.sendTextMessage(senderID, contentManager.getValue("alertSettingMessage4"));

            setTimeout(() => {
                msgFormat.sendTextMessage(senderID, contentManager.getValue("alertSettingMessage6"));
            }, 500);

            setTimeout(() => {
                templates.sendShowOptions(userContext);
            }, 1100);
        }
        else {
            templates.sendSystemErrorMessage(userContext);
        }
    }
};

const unmuteAlerts = async(userContext) => {

    let senderID = userContext.getUserId();
    const contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    try {
        const user = await userInterface.findUser(senderID);
        if (user && user !== null) {
            user.notifications = true;
            const updateResponse = await userInterface.saveOrUpdateUser(user);

            if (updateResponse.notifications == true) {

                msgFormat.sendTextMessage(senderID, contentManager.getValue("alertSettingMessage5"));

                setTimeout(() => {
                    showExistingAlertSettings(user, senderID, contentManager, () => {
                        setTimeout(() => {
                            templates.sendShowOptions(userContext);
                        }, 1500)
                    });
                }, 400);
            }
        }
    }
    catch (error) {
        console.error("\nError Turning off notifications\n");
        console.error(error);
        templates.sendSystemErrorMessage(userContext);
    }
};

const changeAlertPreferences = async(userContext) => {

    let senderID = userContext.getUserId();
    const contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    try {
        const user = await userInterface.findUser(senderID);

        if (user && user !== null) {

            if (user.notifications) {
                showExistingAlertSettings(user, senderID, contentManager, () => {

                    setTimeout(() => {
                        templates.sendCustomizeAlertSettingsButton(userContext);
                    }, 1500);
                });
            }
            else
                templates.sendTurnAlertsOnButton(userContext);
        }
    }
    catch (error) {
        console.error(error);
        templates.sendSystemErrorMessage(userContext);
    }
};

const promptForAmountWithQuickReply = async(userContext, context, parameters) => {

    if (parameters && parameters !== "") {

        if (utilities.isDefined(parameters.merchant_type) && parameters.merchant_type.length > 0) {
            templates.sendChangeAlertAmountForMCCQuickReply(userContext, merchantCategories[parameters.merchant_type])
        } else {
            templates.sendChangeAlertAmountQuickReply(userContext);
        }
    }
};

const removeTransactionAlert = async(userContext, contexts) => {

    let alert = {};

    let userId = userContext.getUserId();
    //get document_id and user_id from database
    const user = await userInterface.findUser(userId);

    if (user && user.user_id !== undefined) {

        let contentManager = new ContentManager();
        await contentManager.loadContent(user.locale);
        let userContext = new UserContext(userId, user.locale);

        alert.user_id = user.user_id;
        alert.ctc_document_id = user.ctc_document_id;

        try {
            if (contexts && contexts !== "") {

                _.each(contexts, (context) => {

                    if (context.name === "delete-alert") {
                        let parameters = context.parameters;

                        if (parameters.merchant_type !== "") {
                            alert.type = "merchant";
                            alert.merchant_type = parameters.merchant_type;
                        }
                    }
                });
            }
            //delete alert
            const alertResponse = await ctcSDK.deleteAlert(alert);

            if (alertResponse && alertResponse.statusCode == httpStatus.NO_CONTENT)
                templates.sendDeleteAlertConfirmationForMCC(userContext, merchantCategories[alert.merchant_type]);

            else if (alertResponse && alertResponse.statusCode == httpStatus.BAD_REQUEST) {

                msgFormat.sendTextMessage(userContext.getUserId(), contentManager.getValue("alertNotFound").replace("{{$0}}", emoji.get(contentManager.getValue("confusedEmoji"))));

                showExistingAlertSettings(user, userContext.getUserId(), contentManager, () => {
                    templates.sendShowOptions(userContext);
                });
            }
        }
        catch (error) {
            console.error("\nError Disconnecting Account");
            console.error(error);
            templates.sendSystemErrorMessage(userContext);
        }
    }
};


module.exports = {
    setTransactionAlert,
    getAlertSettings,
    manageAlerts,
    muteAlerts,
    unmuteAlerts,
    changeAlertPreferences,
    promptForAmountWithQuickReply,
    removeTransactionAlert
};