/**
 * Created by mayujain on 7/11/17.
 */

let app = require('../../main');
let controller = app.get('controller');
let bot = app.get('bot');
const templates = require('../../messages');
const utilities = require('../../utilities');
let UserContext = require("../../models/UserContext");
const config = require('../../resources/configuration.json');
const SHUTDOWN_BOT = config['SHUTDOWN'];

module.exports = {
    /*
     * Authorization Event
     *
     * The value for 'optin.ref' is defined in the entry point. For the "Send to
     * Messenger" plugin, it is the 'data-ref' field. Read more at
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
     */
    receivedAuthenticationReuestFromUser: async (event) => {
        let senderID = event.sender.id;
        let recipientID = event.recipient.id;
        let timeOfAuth = event.timestamp;

        // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
        // The developer can set this to an arbitrary value to associate the
        // authentication callback with the 'Send to Messenger' click event. This is
        // a way to do account linking when the user clicks the 'Send to Messenger'
        // plugin.
        let passThroughParam = event.optin.ref;

        console.log("Received authentication for user %d and page %d with pass through param '%s' at %d", senderID, recipientID, passThroughParam, timeOfAuth);

        let message = {
            optin: event.optin,
            param: passThroughParam,
            user: senderID,
            channel: senderID,
            page: recipientID,
            timestamp: timeOfAuth
        };

        if (SHUTDOWN_BOT) {
            console.log("SHUTDOWN_BOT: " + SHUTDOWN_BOT);
            const userProfile = await utilities.getFacebookProfile(senderID);
            let userContext = new UserContext(senderID, userProfile.locale);
            templates.sendSystemErrorMessage(userContext);
        }
        else {

            controller.trigger('facebook_optin', [bot, message])
        }
    }
};