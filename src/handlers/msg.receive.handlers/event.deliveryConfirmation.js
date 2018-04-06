/**
 * Created by mayujain on 7/11/17.
 */

let app = require('../../main');
let controller = app.get('controller');
let bot = app.get('bot');

module.exports = {
    /*
     * Delivery Confirmation Event
     *
     * This event is sent to confirm the delivery of a message. Read more about
     * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
     *
     */
    receivedMsgDeliveryConfirmation: (event) => {
        let senderID = event.sender.id;
        let recipientID = event.recipient.id;
        let delivery = event.delivery;
        let messageIDs = delivery.mids;
        let watermark = delivery.watermark;
        let sequenceNumber = delivery.seq;

        let message = {
            delivery: delivery,
            user: senderID,
            channel: senderID,
            page: recipientID,
            mids: messageIDs
        };
        controller.trigger('message_delivered', [bot, message])
    }
};

