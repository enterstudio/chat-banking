/**
 * Created by mayujain on 7/11/17.
 */

const SendMsg = require('../msg.send.handlers/msg.send');
const msgProcessor = require('../../controllers/intent.contolller');
let app = require('../../main');
let controller = app.get('controller');
let bot = app.get('bot');

const getStarted = require('../../actions/get.started');
const userInterface = require('../../db/userInterface');
let ContentManager = require('../../content/ContentManager');
let UserContext = require("../../models/UserContext");
const templates = require('../../messages');
const utilities = require('../../utilities');
const config = require('../../resources/configuration.json');
const SHUTDOWN_BOT = config['SHUTDOWN'];

/*
 * Message Event
 *
 * This event is called when a message is sent to your page. The 'message'
 * object format can lety depending on the kind of message that was received.
 * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
 *
 * For this example, we're going to echo any text that we get. If we get some
 * special keywords ('button', 'generic', 'receipt'), then we'll send back
 * examples of those bubbles to illustrate the special message bubbles we've
 * created. If we receive a message with an attachment (image, video, audio),
 * then we'll simply confirm that we've received the attachment.
 *
 */

module.exports = {

    receivedMessageFromUser: async(event) => {
        let senderID = event.sender.id;
        let recipientID = event.recipient.id;
        let timeOfMessage = event.timestamp;
        let message = event.message;

        let isEcho = message.is_echo;
        let messageId = message.mid;
        let appId = message.app_id;
        let metadata = message.metadata;

        // You may get a text or attachment but not both
        let messageText = message.text;
        let messageAttachments = message.attachments;
        let quickReply = message.quick_reply;

        let facebook_message = {
            text: event.message.text,
            user: event.sender.id,
            channel: event.sender.id,
            page: event.recipient.id,
            timestamp: event.timestamp,
            seq: event.message.seq,
            is_echo: event.message.is_echo,
            mid: event.message.mid,
            sticker_id: event.message.sticker_id,
            attachments: event.message.attachments,
            quick_reply: event.message.quick_reply,
            type: 'user_message',
        };

        if (isEcho) {
            // Just logging message echoes to console
            console.log("Received echo for message %s and app %d with metadata %s", messageId, appId, metadata);
            return;
        } else if (quickReply) {
            console.log("Received Quick reply for message %s with payload %s", messageId, quickReply.payload);
            facebook_message.text = quickReply.payload;
        }

        if (SHUTDOWN_BOT) {
            console.log("SHUTDOWN_BOT: " + SHUTDOWN_BOT);
            const userProfile = await utilities.getFacebookProfile(senderID);
            let userContext = new UserContext(senderID, userProfile.locale);
            templates.sendSystemErrorMessage(userContext);
        }
        else {
            // Check if user has enrolled the card
            userInterface.findUser(senderID)
                .then(user => {
                    if (!user || user == null) {
                        getStarted.sendWelcomeMessage(senderID);
                    }
                    else {
                        let userContext = new UserContext(senderID, user.locale);

                        if (messageText) {
                            console.log(`Received message: "${messageText}" from user : ${user.first_name} ${user.last_name} at ${timeOfMessage}`);
                            switch (messageText) {
                                default:
                                    msgProcessor.processEvent(facebook_message, userContext);
                                    controller.receiveMessage(bot, facebook_message);
                            }
                        }
                        else if (messageAttachments) {
                            console.log(`Received Attachment from user : ${user.first_name} ${user.last_name} at ${timeOfMessage}`);
                            console.log(messageAttachments);
                            templates.sendAttachmentUnsupported(userContext);
                        }
                    }
                })
                .catch(err => {
                    console.log("Error find User.");
                    console.log(err);
                });
        }
    }

};