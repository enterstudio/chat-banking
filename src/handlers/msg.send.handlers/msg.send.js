/**
 * Created by mayujain on 7/11/17.
 */

const SendAPI = require('./sendToFacebook.js');
let app = require('../../main');
let KeyStore = app.get('KeyStore');
const SERVER_URL = KeyStore.get('SERVER_URL');

module.exports = {
    sendTextMessage,
    sendTemplateMessage,
    sendImageMessage,
    sendAudioMessage,
    sendVideoMessage,
    sendFileMessage,
    sendReadReceipt,
};

/*
 * Send a text message using the Send API.
 */
function sendTextMessage(recipientId, messageText, metaData) {
    let messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText,
            metadata: metaData
        }
    };

    SendAPI.sendMsgToFacebook(messageData);
}

/*
 * Send a custom template message using the Send API.
 */
function sendTemplateMessage(recipientId, templateData) {
    let messageData = {
        recipient: {
            id: recipientId
        },
        message: templateData
    };
    SendAPI.sendMsgToFacebook(messageData);
}

/*
 * Send an image using the Send API.
 */
function sendImageMessage(recipientId, imageUrl) {
    let messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "image",
                payload: {
                    url: imageUrl
                }
            }
        }
    };

    SendAPI.sendMsgToFacebook(messageData);
}

/*
 * Send audio using the Send API.
 */
function sendAudioMessage(recipientId, audioUrl) {
    let messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "audio",
                payload: {
                    url: audioUrl
                }
            }
        }
    };

    SendAPI.sendMsgToFacebook(messageData);
}

/*
 * Send a video using the Send API.
 */
function sendVideoMessage(recipientId, videoUrl) {
    let messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "video",
                payload: {
                    url: videoUrl
                }
            }
        }
    };

    SendAPI.sendMsgToFacebook(messageData);
}

/*
 * Send a file using the Send API.
 */
function sendFileMessage(recipientId, fileUrl) {
    let messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "file",
                payload: {
                    url: fileUrl
                }
            }
        }
    };

    SendAPI.sendMsgToFacebook(messageData);
}

/*
 * Send a read receipt to indicate the message has been read
 */
function sendReadReceipt(recipientId) {
    console.log("Sending a read receipt to mark message as seen");

    let messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: "mark_seen"
    };

    SendAPI.sendMsgToFacebook(messageData);
}
