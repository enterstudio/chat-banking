/**
 * Created by mayujain on 7/11/17.
 */

let app = require('../../main');
let controller = app.get('controller');
let bot = app.get('bot');

module.exports = {

    /*
     * Account Link Event
     *
     * This event is called when the Link Account or UnLink Account action has been
     * tapped.
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
     *
     */
    receivedAccountLinkingRequest: (event) => {
        let senderID = event.sender.id;
        let recipientID = event.recipient.id;
        let status = event.account_linking.status;
        let authCode = event.account_linking.authorization_code;

        console.log("Received account link event with for user %d with status %s " +
            "and auth code %s ", senderID, status, authCode);

        let message = {
            user: senderID,
            channel: senderID,
            timestamp: event.timestamp,
            account_linking: event.account_linking
        };

        controller.trigger('facebook_account_linking', [bot, message])
    }
};