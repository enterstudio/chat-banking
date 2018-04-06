/**
 * Created by mayujain on 7/11/17.
 */

const request = require('request');
const httpStatus = require('http-status');
const utilities = require('../../utilities');
const app = require('../../main');
const KeyStore = app.get('KeyStore');
const MESSENGER_PAGE_ACCESS_TOKEN = KeyStore.get('MESSENGER_PAGE_ACCESS_TOKEN');

/*
 * Call the Send API. The message data goes in the body. If successful, we'll
 * get the message id in a response
 */

module.exports = {

    sendMsgToFacebook: async(messageData) => {

        try {
            const typingOnResponse = await utilities.sendTypingOnIndicatorsToMessenger(messageData.recipient.id);
            if (typingOnResponse.statusCode && typingOnResponse.statusCode == httpStatus.OK) {

                //insert delay before sending message.
                // setTimeout(() => {
                    utilities.sendMessageToMessenger(messageData);
                // }, 2000);
            }
            else
                throw new Error(typingOnResponse);

        } catch (error) {
            console.error("Failed sending message to Messenger Send API.");
            console.error(error);
        }
    }
};
