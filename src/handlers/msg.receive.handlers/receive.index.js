/**
 * Created by mayujain on 7/11/17.
 */

const ReceiveMsgEvent = require('./event.receive.msg');
const ReceiveAuthEvent = require('./event.auth');
const ReceiveAccountLinkingEvent = require('./event.accountLinking');
const ReceivePostbackEvent = require('./event.postback');
const ReceiveDeliveryConfirmationEvent = require('./event.deliveryConfirmation');

module.exports = {
    receivedAuthentication: ReceiveAuthEvent.receivedAuthenticationReuestFromUser,
    receivedMessage: ReceiveMsgEvent.receivedMessageFromUser,
    receivedAccountLink: ReceiveAccountLinkingEvent.receivedAccountLinkingRequest,
    receivedPostback: ReceivePostbackEvent.receivedPostbackMessage,
    receivedDeliveryConfirmation: ReceiveDeliveryConfirmationEvent.receivedMsgDeliveryConfirmation
};
