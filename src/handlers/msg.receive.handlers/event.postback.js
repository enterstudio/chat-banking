/**
 * Created by mayujain on 7/11/17.
 */

let app = require('../../main');
let controller = app.get('controller');
let bot = app.get('bot');
const utilities = require('../../utilities');
const getStarted = require('../../actions/get.started');
const userInterface = require('../../db/userInterface');
let UserContext = require("../../models/UserContext");
const config = require('../../resources/configuration.json');
const SHUTDOWN_BOT = config['SHUTDOWN'];
const templates = require('../../messages');

module.exports = {
    receivedPostbackMessage
};


async function receivedPostbackMessage(event) {
    let senderID = event.sender.id;
    let recipientID = event.recipient.id;
    let timeOfPostback = event.timestamp;
    let payload = event.postback.payload;
    // console.log("Received postback for user %d and page %d at %d with payload '%s' ", senderID, recipientID, timeOfPostback, payload);

    let message = {
        text: event.postback.payload,
        payload: event.postback.payload,
        user: event.sender.id,
        channel: event.sender.id,
        page: event.recipient.id,
        timestamp: event.timestamp,
        referral: event.postback.referral,
    };

    if (SHUTDOWN_BOT) {
        console.log("SHUTDOWN_BOT: " + SHUTDOWN_BOT);
        const userProfile = await utilities.getFacebookProfile(senderID);
        let userContext = new UserContext(senderID, userProfile.locale);
        templates.sendSystemErrorMessage(userContext);
    }
    else {

        userInterface.findUser(senderID)
            .then(user => {
                if (!user || user == null)
                    getStarted.sendWelcomeMessage(senderID);
                else {
                    console.log(`User: ${user.first_name} ${user.last_name} clicked on "${payload}" button at ${timeOfPostback}`);
                    let userContext = new UserContext(message.user, user.locale);
                    controller.trigger('facebook_postback', [bot, message, userContext]);
                }
            })
            .catch(err => {
                console.log("Error find User.");
                console.log(err);
            });
    }
}
