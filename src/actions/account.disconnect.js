/**
 * Created by mayujain on 8/11/17.
 */

const uuid = require('node-uuid');
const _ = require('underscore');
const httpStatus = require('http-status');

const app = require('../main');
const KeyStore = app.get('KeyStore');
const ctcSDK = require('../apiSdk/ctcSdk');
const templates = require('../messages');
const msgFormat = require('../handlers/msg.send.handlers/msg.send');
const userInterface = require('../db/userInterface');
const UserContext = require("../models/UserContext");
const ContentManager = require('../content/ContentManager');
const utilities = require('../utilities');


const showDisconnectAccountQuickReply = async(userContext) => {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    msgFormat.sendTextMessage(userContext.getUserId(), contentManager.getValue("disconnectAccountMessage1"));

    setTimeout(() => {
        templates.sendDisconnectAccountOptionsQuickReply(userContext);
    }, 800);
};

const confirmedDisconnectAccount = async(senderID) => {

    const user = await userInterface.findUser(senderID);

    if (user && user.user_id !== undefined) {

        let contentManager = new ContentManager();
        await contentManager.loadContent(user.locale);

        let userContext = new UserContext(senderID, user.locale);
        try {
            console.log(`Deleting Account for user: ${user.first_name} ${user.last_name}`);

            const deleteDocumentIdResponse = await ctcSDK.deleteDocumentId(user.ctc_document_id);

            console.log({Delete_CTC_DcumentId_Response: deleteDocumentIdResponse});

            if (deleteDocumentIdResponse && deleteDocumentIdResponse.status_code == httpStatus.NO_CONTENT) {

                const dbResponse = await userInterface.deleteUser(senderID);

                templates.sendDisconnectAccountConfirmation(userContext);
            }
            else
                throw new Error(deleteDocumentIdResponse);
        }
        catch (error) {
            console.error("Error disconnecting account. " + error);
            templates.sendSystemErrorMessage(userContext);
        }
    }
};

const cancelDisconnectAccount = async(userContext) => {
    templates.sendDisconnectAccountCancel(userContext);
};

const askDisconnectConfirmation = async(userContext, contexts) => {

    console.log(JSON.stringify(contexts, null, 4));

    if (utilities.isDefined(contexts) && contexts.length > 0) {
        _.each(contexts, (ctx) => {

            if (ctx.name === "disconnectaccount") {

                setTimeout(() => {
                    showDisconnectAccountQuickReply(userContext);
                }, 500);
            }
        })
    }
};

const triggerDisconnectAccountIntent = async(userContext) => {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());
    let senderID = userContext.getUserId();

    try {
        if (!KeyStore.has(senderID))
            KeyStore.set(senderID, uuid.v1());

        const nlpQueryResponse = await utilities.sendQueryToNlpAgent(KeyStore.get(senderID), "Disconnect Account");

        if (utilities.isDefined(nlpQueryResponse.result)) {

            console.log("Triggered Account Disconnect");

            console.log(JSON.stringify(nlpQueryResponse.result, null, 4));

            let context = nlpQueryResponse.result.contexts;
            let responseText = nlpQueryResponse.result.fulfillment.speech;

            if (utilities.isDefined(responseText) && responseText == "askDisconnectConfirmation")
                askDisconnectConfirmation(userContext, context);
            else
                throw new Error("Did not trigger Disconnect Account intent.")
        }

    }
    catch (error) {
        console.error("Error while Triggering Disconnect Account Intent from DISCONNECT_ACCOUNT postback event");
        console.error(error);
        templates.sendSystemErrorMessage(userContext);
    }
};

module.exports = {
    showDisconnectAccountQuickReply,
    confirmedDisconnectAccount,
    cancelDisconnectAccount,
    askDisconnectConfirmation,
    triggerDisconnectAccountIntent
};