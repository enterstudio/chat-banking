'use strict';

const request = require('request');
const config = require('./resources/configuration.json');
const emoji = require('node-emoji');
const async = require('async');

const utilities = require('./utilities');
const app = require('./main');
const KeyStore = app.get('KeyStore');
const SERVER_URL = KeyStore.get('SERVER_URL');
const SendAPI = require('./handlers/msg.send.handlers/sendToFacebook');
const msgFormat = require('./handlers/msg.send.handlers/msg.send');
const ContentManager = require('./content/ContentManager');
const EventLogger = require("./analytics/EventLogger");

const TRANSACTION_ALERTS = config['TRANSACTION_ALERTS'];
const ACCOUNT_INFORMATION = config['ACCOUNT_INFORMATION'];
const ACCOUNT_BALANCE = config['ACCOUNT_BALANCE'];
const TRANSACTION_HISTORY = config['TRANSACTION_HISTORY'];
const TRAVEL_NOTIFICATIONS = config['TRAVEL_NOTIFICATIONS'];
const CREATE_TRAVEL_NOTIFICATIONS = config['CREATE_TRAVEL_NOTIFICATIONS'];
const GET_TRAVEL_NOTIFICATIONS = config['GET_TRAVEL_NOTIFICATIONS'];
const UPDATE_TRAVEL_NOTIFICATIONS = config['UPDATE_TRAVEL_NOTIFICATIONS'];
const IMAGE_ACCOUNT_INFO = config['IMAGE_URLS']['ACCOUNT_INFO'];
const IMAGE_MANAGE_ALERTS = config['IMAGE_URLS']['MANAGE_ALERTS'];
const IMAGE_TRAVEL_NOTIFICATIONS = config['IMAGE_URLS']['TRAVEL_NOTIFICATIONS'];


module.exports = {
    sendMainMenu,
    sendShowOptions,
    sendManageNotificationsMenu1,
    sendManageNotificationsMenu2,
    sendChangeAlertAmountQuickReply,
    sendEnrollCardButton,
    sendFailedCardEnrollment,
    sendSuccessCardEnrollment,
    sendDisconnectAccountOptionsQuickReply,
    sendDisconnectAccountConfirmation,
    sendDisconnectAccountCancel,
    sendSetAlertConfirmation,
    sendSetAlertConfirmationForMCC,
    sendAlertToUser,
    showAlertDetails,
    sendCustomerSupportDetails,
    sendContactBank,
    sendCustomizeAlertSettingsButton,
    sendSetCategoryAlertQuickReplyOptions,
    sendShowMoreCategoriesQuickReply,
    sendChangeAlertAmountForMCCQuickReply,
    sendDCASMenu,
    sendTurnAlertsOnButton,
    sendChangeAlertSettingsQuickReply,
    sendTravelNotificationsMenu,
    sendEmptyTravelItineraryQuickReply,
    sendAskConfirmationForTravelItineraryQuickReply,
    sendLoginButtonAfterLogout,
    sendUnsupportedRequest,
    sendDeleteAlertConfirmationForMCC,
    sendSystemErrorMessage,
    sendKeepNotificationsOff,
    sendThumbsUpAndMenu,
    sendAttachmentUnsupported,
    sendJokeMessage
};

async function sendEnrollCardButton(userContext) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());
    let enrollMessageContent = contentManager.getValue('enrollMessageText');
    let senderID = userContext.getUserId();

    let enrollMessage = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": enrollMessageContent,
                "buttons": [
                    {
                        "type": "web_url",
                        "title": contentManager.getValue('connectAccountButtonTitle'),
                        "url": SERVER_URL + "/enroll/" + senderID,
                        "webview_height_ratio": "tall",
                        "webview_share_button": "hide",
                        "messenger_extensions": true
                    }
                ]
            }
        }
    };

    msgFormat.sendTemplateMessage(userContext.getUserId(), enrollMessage);
}

async function sendMainMenu(userContext, text) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());
    let menuItems = [];

    if (ACCOUNT_INFORMATION && ACCOUNT_BALANCE && TRANSACTION_HISTORY) {
        menuItems.push({
            "title": contentManager.getValue('getAccountInformationTitle'),
            "image_url": IMAGE_ACCOUNT_INFO,
            "subtitle": contentManager.getValue('getAccountInformationSubtitle'),
            "buttons": [
                {
                    "type": "postback",
                    "title": contentManager.getValue('getAccountInformationButton1Title'),
                    "payload": "GET_ACCOUNT_INFO"
                }
            ]
        });
    }
    else if(ACCOUNT_INFORMATION && ACCOUNT_BALANCE){
        menuItems.push({
            "title": contentManager.getValue('accountBalanceTitle'),
            "image_url": IMAGE_ACCOUNT_INFO,
            "subtitle": contentManager.getValue('accountBalanceSubTitle'),
            "buttons": [
                {
                    "type": "postback",
                    "title": contentManager.getValue('accountBalanceButtonTitle'),
                    "payload": "GET_ACCOUNT_BALANCE"
                }
            ]
        });
    }

    if (TRAVEL_NOTIFICATIONS) {
        menuItems.push({
            "title": contentManager.getValue('notifyBankOfTravelTitle'),
            "image_url": IMAGE_TRAVEL_NOTIFICATIONS,
            "subtitle": contentManager.getValue('notifyBankOfTravelSubtitle'),
            "buttons": [
                {
                    "type": "postback",
                    "title": contentManager.getValue('notifyBankOfTravelButton1Title'),
                    "payload": "TRAVEL_NOTIFICATIONS_MENU"
                }
            ]
        });
    }

    if (TRANSACTION_ALERTS) {
        menuItems.push({
            "title": contentManager.getValue('manageSpendingNotificationsTitle'),
            "image_url": IMAGE_MANAGE_ALERTS,
            "subtitle": contentManager.getValue('manageSpendingNotificationsSubtitle'),
            "buttons": [
                {
                    "type": "postback",
                    "title": contentManager.getValue('manageSpendingNotificationsButton1Title'),
                    "payload": "MANAGE_ALERTS"
                }
            ]
        });
    }

    let genericMainMenuTemplate = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "sharable": false,
                "elements": menuItems
            }
        }
    };

    if (!utilities.isDefined(text))
        text = contentManager.getValue('mainMenuMessage');

    msgFormat.sendTextMessage(userContext.getUserId(), text);

    setTimeout(() => {
        msgFormat.sendTemplateMessage(userContext.getUserId(), genericMainMenuTemplate);
    }, 1000);
}

async function sendShowOptions(userContext, text) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    if (text != undefined || text != "")
        text = contentManager.getValue("optionsButtonText");

    let buttonMsg = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": text,
                "buttons": [
                    {
                        "title": contentManager.getValue("optionsButton1Title"),
                        "type": "postback",
                        "payload": "Menu"
                    }
                ]
            }
        }
    };
    msgFormat.sendTemplateMessage(userContext.getUserId(), buttonMsg);
}

async function sendManageNotificationsMenu1(userContext) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    let notificationsMenu = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": contentManager.getValue('manageNotificationsText'),
                "buttons": [
                    {
                        "type": "postback",
                        "title": contentManager.getValue("manageNotificationsButton1Title"),
                        "payload": "SHOW_ALERT_SETTINGS"
                    },
                    {
                        "type": "postback",
                        "title": contentManager.getValue("manageNotificationsButton2Title"),
                        "payload": "CHANGE_NOTIFICATION_PREFERENCES"
                    },
                    {
                        "type": "postback",
                        "title": contentManager.getValue("manageNotificationsButton3Title"),
                        "payload": "TURN_OFF_ALL_NOTIFICATIONS"
                    }
                ]
            }
        }
    };

    setTimeout(() => {
        msgFormat.sendTemplateMessage(userContext.getUserId(), notificationsMenu);
    }, 1000);
}

async function sendManageNotificationsMenu2(userContext) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    let notificationsMenu = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": contentManager.getValue('manageNotificationsText'),
                "buttons": [
                    {
                        "type": "postback",
                        "title": contentManager.getValue("manageNotificationsButton1Title"),
                        "payload": "SHOW_ALERT_SETTINGS"
                    },
                    {
                        "type": "postback",
                        "title": contentManager.getValue("manageNotificationsButton2Title"),
                        "payload": "CHANGE_NOTIFICATION_PREFERENCES"
                    },
                    {
                        "type": "postback",
                        "title": contentManager.getValue("manageNotificationsButton4Title"),
                        "payload": "TURN_ON_ALL_NOTIFICATIONS"
                    }
                ]
            }
        }
    };

    setTimeout(() => {
        msgFormat.sendTemplateMessage(userContext.getUserId(), notificationsMenu);
    }, 1000);
}

async function sendChangeAlertAmountQuickReply(userContext) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    let quickReply = {
        "recipient": {
            "id": userContext.getUserId(),
        },
        "message": {
            "text": contentManager.getValue("changeAlertAmountText"),
            "quick_replies": [
                {
                    "content_type": "text",
                    "title": contentManager.getValue("changeAlertAmountQr0Title"),
                    "payload": contentManager.getValue("changeAlertAmountQr0Payload")
                },
                {
                    "content_type": "text",
                    "title": contentManager.getValue("changeAlertAmountQr1Title"),
                    "payload": contentManager.getValue("changeAlertAmountQr1Payload")
                },
                {
                    "content_type": "text",
                    "title": contentManager.getValue("changeAlertAmountQr2Title"),
                    "payload": contentManager.getValue("changeAlertAmountQr2Payload")
                },
                {
                    "content_type": "text",
                    "title": contentManager.getValue("changeAlertAmountQr3Title"),
                    "payload": contentManager.getValue("changeAlertAmountQr3Payload")
                },
                {
                    "content_type": "text",
                    "title": contentManager.getValue("changeAlertAmountQr4Title"),
                    "payload": contentManager.getValue("changeAlertAmountQr4Payload")
                }
            ]
        }
    };
    SendAPI.sendMsgToFacebook(quickReply);
}

async function sendCustomizeAlertSettingsButton(userContext) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    let message = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": contentManager.getValue("customizeAlertsText"),
                "buttons": [
                    {
                        "type": "postback",
                        "title": contentManager.getValue("customizeAlertsButton1Title"),
                        "payload": "MODIFY_GLOBAL_ALERT_AMOUNT"
                    },
                    {
                        "type": "postback",
                        "title": contentManager.getValue("customizeAlertsButton2Title"),
                        "payload": "SET_ALERT_ON_CATEGORY"
                    }
                ]
            }
        }
    };

    msgFormat.sendTemplateMessage(userContext.getUserId(), message);

    setTimeout(()=>{
        msgFormat.sendTextMessage(userContext.getUserId(), contentManager.getValue("customizeAlertsTextOtherOptions"))
    }, 1000)
}

async function sendFailedCardEnrollment(userContext, first_name, text) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    if (text !== undefined || text !== "")
        text = contentManager.getValue("failedCardText").replace("{{@first_name}}", first_name);

    let message = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": text,
                "buttons": [
                    {
                        "type": "web_url",
                        "title": contentManager.getValue("failedCardButton1Title"),
                        "url": SERVER_URL + "/enroll/" + userContext.getUserId(),
                        "webview_height_ratio": "tall",
                        "webview_share_button": "hide",
                        "messenger_extensions": true
                    }
                ]
            }
        }
    };
    msgFormat.sendTemplateMessage(userContext.getUserId(), message);
}

async function sendSuccessCardEnrollment(userContext, first_name) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    msgFormat.sendTextMessage(userContext.getUserId(), contentManager.getValue("successCardMessage1").replace("{{@first_name}}", first_name).replace("{{$0}}", emoji.get(contentManager.getValue("successCardMessage1Emoji"))));

    let quickReply = {
        "recipient": {
            "id": userContext.getUserId(),
        },
        "message": {
            "text": contentManager.getValue("successCardMessage2"),
            "quick_replies": [
                {
                    "content_type": "text",
                    "title": contentManager.getValue("soundsGoodQR1").replace("{{$0}}", emoji.get(contentManager.getValue("soundsGoodQR1Emoji"))),
                    "payload": `Show Menu`
                },
                {
                    "content_type": "text",
                    "title": contentManager.getValue("manageNotificationsQR2"),
                    "payload": `MANAGE NOTIFICATIONS`
                }
            ]
        }
    };

    setTimeout(() => {
        SendAPI.sendMsgToFacebook(quickReply);
    }, 1500);
}

async function sendDisconnectAccountOptionsQuickReply(userContext) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    let quickReply = {
        "text": contentManager.getValue("disconnectAccountText"),
        "quick_replies": [
            {
                "content_type": "text",
                "title": contentManager.getValue("disconnectAccountQr1Title"),
                "payload": "Yes disconnect account."
            },
            {
                "content_type": "text",
                "title": contentManager.getValue("disconnectAccountQr2Title"),
                "payload": "Don't disconnect account."
            }
        ]
    };

    msgFormat.sendTemplateMessage(userContext.getUserId(), quickReply);
}

async function sendDisconnectAccountConfirmation(userContext) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    msgFormat.sendTextMessage(userContext.getUserId(), contentManager.getValue("disconnectAccountConfirmMessage1"));

    sendLoginButtonAfterLogout(userContext);

}

async function sendDisconnectAccountCancel(userContext) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());
    msgFormat.sendTextMessage(userContext.getUserId(), contentManager.getValue("disconnectAccountAbortMessage1"));

    setTimeout(() => {
        sendShowOptions(userContext);
    }, 1000);

}

async function sendSetAlertConfirmation(userContext, amount) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());
    let message = contentManager.getValue("alertConfirmationMessage1").replace("{{$0}}", amount);
    msgFormat.sendTextMessage(userContext.getUserId(), message);
    setTimeout(() => {
        sendShowOptions(userContext);
    }, 1000);
}

async function sendSetAlertConfirmationForMCC(userContext, amount, merchant_type, first_name) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    let message = contentManager.getValue("alertConfirmationMessage2").replace("{{@first_name}}", first_name).replace("{{$0}}", amount).replace("{{$1}}", merchant_type);
    setTimeout(() => {
        msgFormat.sendTextMessage(userContext.getUserId(), message);
    }, 1000);

    setTimeout(() => {
        sendShowOptions(userContext);
    }, 2000);
}

async function sendDeleteAlertConfirmationForMCC(userContext, merchant_type) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    setTimeout(() => {
        msgFormat.sendTextMessage(userContext.getUserId(), contentManager.getValue("alertDeleteConfirmationMessageForMCC").replace("{{$0}}", merchant_type));
    }, 1000);

    setTimeout(() => {
        sendShowOptions(userContext);
    }, 2000);
}

async function sendAlertToUser(userContext, text, showDetails, alertPayload) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());
    let senderID = userContext.getUserId();

    if (TRANSACTION_ALERTS) {

        if (showDetails) {

            let alertButton = {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "button",
                        "text": text,
                        "buttons": [
                            {
                                "type": "postback",
                                "title": contentManager.getValue("customAlertMessageButton1Title"),
                                "payload": alertPayload
                            }
                        ]
                    }
                }
            };
            msgFormat.sendTemplateMessage(senderID, alertButton);
        }
        else {
            msgFormat.sendTextMessage(senderID, text);
        }
    }
}

async function showAlertDetails(userContext, payload) {

    if (TRANSACTION_ALERTS) {
        let contentManager = new ContentManager();
        await contentManager.loadContent(userContext.getLocale());

        let quickReply = {
            "recipient": {
                "id": userContext.getUserId(),
            },
            "message": {
                "text": payload,
                "quick_replies": [
                    {
                        "content_type": "text",
                        "title": contentManager.getValue("alertDetailsButton2Title"),
                        "payload": "SEND_THUMB_UP"
                    },
                    {
                        "content_type": "text",
                        "title": contentManager.getValue("alertDetailsButton1Title"),
                        "payload": "UNRECOGNIZED_TRANSACTION"
                    }
                ]
            }
        };

        setTimeout(()=> {
            SendAPI.sendMsgToFacebook(quickReply);
        }, 1000);
    }
}

async function sendCustomerSupportDetails(userContext) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());
    msgFormat.sendTextMessage(userContext.getUserId(), contentManager.getValue("unrecognizedTransactionMessage").replace("{{$0}}", contentManager.getValue("bankPhone")));
    setTimeout(()=>{
        sendShowOptions(userContext);
    }, 1200);
}

async function sendContactBank(userContext) {
    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());
    msgFormat.sendTextMessage(userContext.getUserId(), contentManager.getValue("contactBankMessage").replace("{{@bankPhone}}", contentManager.getValue("bankPhone")));
}

async function sendSetCategoryAlertQuickReplyOptions(userContext) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    let quickReply = {
        "recipient": {
            "id": userContext.getUserId(),
        },
        "message": {
            "text": contentManager.getValue("alertCategoryText"),
            "quick_replies": [
                {
                    "content_type": "text",
                    "title": contentManager.getValue("alertCategoryQr1Title"),
                    "payload": contentManager.getValue("alertCategoryQr1Payload")
                },
                {
                    "content_type": "text",
                    "title": contentManager.getValue("alertCategoryQr2Title"),
                    "payload": contentManager.getValue("alertCategoryQr2Payload")
                },
                {
                    "content_type": "text",
                    "title": contentManager.getValue("alertCategoryQr3Title"),
                    "payload": contentManager.getValue("alertCategoryQr3Payload")
                },
                {
                    "content_type": "text",
                    "title": contentManager.getValue("alertCategoryQr4Title"),
                    "payload": contentManager.getValue("alertCategoryQr4Payload")
                },
                {
                    "content_type": "text",
                    "title": contentManager.getValue("alertCategoryQr5Title"),
                    "payload": contentManager.getValue("alertCategoryQr5Payload")
                },
                {
                    "content_type": "text",
                    "title": contentManager.getValue("alertCategoryQr6Title"),
                    "payload": "SHOW_MORE_CATEGORIES_FOR_ALERTS"
                }
            ]
        }
    };
    SendAPI.sendMsgToFacebook(quickReply);
}

async function sendShowMoreCategoriesQuickReply(userContext) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    let quickReply = {
        "recipient": {
            "id": userContext.getUserId(),
        },
        "message": {
            "text": contentManager.getValue("moreAlertCategoryText"),
            "quick_replies": [
                {
                    "content_type": "text",
                    "title": contentManager.getValue("alertCategoryQr7Title"),
                    "payload": contentManager.getValue("alertCategoryQr7Payload")
                },
                {
                    "content_type": "text",
                    "title": contentManager.getValue("alertCategoryQr8Title"),
                    "payload": contentManager.getValue("alertCategoryQr8Payload")
                },
                {
                    "content_type": "text",
                    "title": contentManager.getValue("alertCategoryQr9Title"),
                    "payload": contentManager.getValue("alertCategoryQr9Payload")
                },
                {
                    "content_type": "text",
                    "title": contentManager.getValue("alertCategoryQr10Title"),
                    "payload": contentManager.getValue("alertCategoryQr10Payload")
                },
                {
                    "content_type": "text",
                    "title": contentManager.getValue("alertCategoryQr11Title"),
                    "payload": contentManager.getValue("alertCategoryQr11Payload")
                }
            ]
        }
    };
    SendAPI.sendMsgToFacebook(quickReply);
}

async function sendChangeAlertAmountForMCCQuickReply(userContext, merchantType) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    let quickReply = {
        "recipient": {
            "id": userContext.getUserId(),
        },
        "message": {
            "text": contentManager.getValue("changeAlertAmountMerchantText").replace("{{$0}}", emoji.get(contentManager.getValue("soundsGoodQR1Emoji"))).replace("{{$1}}", merchantType),
            "quick_replies": [
                {
                    "content_type": "text",
                    "title": contentManager.getValue("changeAlertAmountMerchantQr0Title"),
                    "payload": contentManager.getValue("changeAlertAmountMerchantQr0Payload").replace("{{$0}}", merchantType)
                },
                {
                    "content_type": "text",
                    "title": contentManager.getValue("changeAlertAmountMerchantQr1Title"),
                    "payload": contentManager.getValue("changeAlertAmountMerchantQr1Payload").replace("{{$0}}", merchantType)
                },
                {
                    "content_type": "text",
                    "title": contentManager.getValue("changeAlertAmountMerchantQr2Title"),
                    "payload": contentManager.getValue("changeAlertAmountMerchantQr2Payload").replace("{{$0}}", merchantType)
                },
                {
                    "content_type": "text",
                    "title": contentManager.getValue("changeAlertAmountMerchantQr3Title"),
                    "payload": contentManager.getValue("changeAlertAmountMerchantQr3Payload").replace("{{$0}}", merchantType)
                },
                {
                    "content_type": "text",
                    "title": contentManager.getValue("changeAlertAmountMerchantQr4Title"),
                    "payload": contentManager.getValue("changeAlertAmountMerchantQr4Payload").replace("{{$0}}", merchantType)
                }
            ]
        }
    };
    SendAPI.sendMsgToFacebook(quickReply);
}

async function sendDCASMenu(userContext) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    let buttonItems = [];

    if (ACCOUNT_BALANCE) {
        buttonItems.push({
            "type": "postback",
            "title": contentManager.getValue('dcasMenuButton1Title'),
            "payload": "GET_ACCOUNT_BALANCE"
        });
    }

    if (TRANSACTION_HISTORY) {
        buttonItems.push({
            "type": "postback",
            "title": contentManager.getValue('dcasMenuButton2Title'),
            "payload": "GET_RECENT_TRANSACTIONS"
        });
    }

    let buttonMsg = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": contentManager.getValue('dcasMenuText'),
                "buttons": buttonItems
            }
        }
    };

    msgFormat.sendTemplateMessage(userContext.getUserId(), buttonMsg);
}

async function sendTurnAlertsOnButton(userContext) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    let confirmationQuickReply = {
        "recipient": {
            "id": userContext.getUserId(),
        },
        "message": {
            "text": contentManager.getValue("turnAlertsOnText"),
            "quick_replies": [
                {
                    "content_type": "text",
                    "title": contentManager.getValue("turnAlertsOnQr1Title"),
                    "payload": `TURN_ON_TXN_NOTIFICATIONS`
                },
                {
                    "content_type": "text",
                    "title": contentManager.getValue("turnAlertsOnQr2Title"),
                    "payload": `KEEP_NOTIFICATIONS_TURNED_OFF`
                }
            ]
        }
    };
    setTimeout(() => {
        SendAPI.sendMsgToFacebook(confirmationQuickReply);
    }, 1000);
}

async function sendChangeAlertSettingsQuickReply(userContext) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    let confirmationQuickReply = {
        "recipient": {
            "id": userContext.getUserId(),
        },
        "message": {
            "text": contentManager.getValue("changeAlertSettingConfirmText"),
            "quick_replies": [
                {
                    "content_type": "text",
                    "title": contentManager.getValue("changeAlertSettingConfirmQr1Title"),
                    "payload": `CHANGE_NOTIFICATION_PREFERENCES`
                },
                {
                    "content_type": "text",
                    "title": contentManager.getValue("changeAlertSettingConfirmQr2Title"),
                    "payload": `SHOW_OPTIONS`
                }
            ]
        }
    };

    SendAPI.sendMsgToFacebook(confirmationQuickReply);
}

async function sendTravelNotificationsMenu(userContext) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    // setTimeout(()=>{
        msgFormat.sendTextMessage(userContext.getUserId(), contentManager.getValue("travelNotificationMenuMessage1"));
    // }, 1000);

    setTimeout(()=>{
        msgFormat.sendTextMessage(userContext.getUserId(), contentManager.getValue("travelNotificationMenuMessage2"));
    }, 2000);

    let buttonItems = [];

    if (CREATE_TRAVEL_NOTIFICATIONS) {
        buttonItems.push({
            "type": "postback",
            "title": contentManager.getValue("travelNotificationMenuButton1Title"),
            "payload": "NOTIFY_BANK_OF_TRAVEL"
        });
    }

    if (UPDATE_TRAVEL_NOTIFICATIONS) {
        buttonItems.push({
            "type": "postback",
            "title": contentManager.getValue("travelNotificationMenuButton2Title"),
            "payload": "UPDATE_TRAVEL_NOTIFICATIONS"
        });
    }

    if (GET_TRAVEL_NOTIFICATIONS) {
        buttonItems.push({
            "type": "postback",
            "title": contentManager.getValue("travelNotificationMenuButton3Title"),
            "payload": "VIEW_TRAVEL_NOTIFICATIONS"
        });
    }

    let buttonMsg = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": contentManager.getValue("travelNotificationMenuText"),
                "buttons": buttonItems
            }
        }
    };

    setTimeout(()=>{
        msgFormat.sendTemplateMessage(userContext.getUserId(), buttonMsg);
    }, 3000);
}

async function sendEmptyTravelItineraryQuickReply(userContext) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    let quickReply = {
        "recipient": {
            "id": userContext.getUserId(),
        },
        "message": {
            "text": contentManager.getValue("emptyTravelItineraryText"),
            "quick_replies": [
                {
                    "content_type": "text",
                    "title": contentManager.getValue("emptyTravelItineraryQr1Title"),
                    "payload": `NOTIFY_BANK_OF_TRAVEL`
                },
                {
                    "content_type": "text",
                    "title": contentManager.getValue("emptyTravelItineraryQr2Title"),
                    "payload": `SHOW_OPTIONS`
                }
            ]
        }
    };

    SendAPI.sendMsgToFacebook(quickReply);
}

async function sendAskConfirmationForTravelItineraryQuickReply(userContext) {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    let quickReply = {
        "recipient": {
            "id": userContext.getUserId(),
        },
        "message": {
            "text": contentManager.getValue("travelItineraryConfirmationText"),
            "quick_replies": [
                {
                    "content_type": "text",
                    "title": contentManager.getValue("travelItineraryConfirmationYes").replace("{{$0}}", emoji.get(contentManager.getValue("travelItineraryConfirmationYesEmoji"))),
                    "payload": `Yes`
                },
                {
                    "content_type": "text",
                    "title": contentManager.getValue("travelItineraryConfirmationNo").replace("{{$0}}", emoji.get(contentManager.getValue("travelItineraryConfirmationNoEmoji"))),
                    "payload": `No`
                }
            ]
        }
    };

    SendAPI.sendMsgToFacebook(quickReply);
}

async function sendLoginButtonAfterLogout(userContext) {

    const contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    let loginButton = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": contentManager.getValue("connectAgain"),
                "buttons": [
                    {
                        "type": "web_url",
                        "title": contentManager.getValue('connectAccountAgainButtonTitle'),
                        "url": SERVER_URL + "/enroll/" + userContext.getUserId(),
                        "webview_height_ratio": "tall",
                        "webview_share_button": "hide",
                        "messenger_extensions": true
                    }
                ]
            }
        }
    };

    setTimeout(() => {
        msgFormat.sendTemplateMessage(userContext.getUserId(), loginButton);
    }, 2000)
}

async function sendUnsupportedRequest(userContext) {

    const contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());
    const senderID = userContext.getUserId();

    let randomIndex = Math.floor(Math.random() * 3);

    console.log(`Sending Unsupported Message ${randomIndex}`);

    switch (randomIndex){

        case 0:
            setTimeout(() => {
                msgFormat.sendTextMessage(senderID, contentManager.getValue('unsupportedRequestMessage1'));
            }, 1000);

            setTimeout(() => {
                msgFormat.sendTextMessage(senderID, contentManager.getValue('unsupportedRequestMessage2').replace("{{$0}}", contentManager.getValue('bankURL')));
            }, 2000);

            setTimeout(() => {
                sendMainMenu(userContext, contentManager.getValue('carouselMenuTextForUnsupportedRequest'));
            }, 3000);
            break;

        case 1:
            setTimeout(() => {
                msgFormat.sendTextMessage(senderID, contentManager.getValue('unsupportedRequestMessage3'));
            }, 1000);
            break;

        case 2:
            setTimeout(() => {
                msgFormat.sendTextMessage(senderID, contentManager.getValue('unsupportedRequestMessage4'));
            }, 1000);

            setTimeout(() => {
                msgFormat.sendTextMessage(senderID, contentManager.getValue('unsupportedRequestMessage2').replace("{{$0}}", contentManager.getValue('bankURL')));
            }, 2000);

            setTimeout(() => {
                sendMainMenu(userContext, contentManager.getValue('carouselMenuTextForUnsupportedRequest'));
            }, 3000);
            break;
    }
}

async function sendSystemErrorMessage(userContext) {

    const contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());
    let senderID = userContext.getUserId();

    let randomIndex = utilities.getRandomNumber(2);

    console.log(`Sending System Error Message ${randomIndex}`);

    switch (randomIndex) {

        case 0:
            msgFormat.sendTextMessage(senderID, contentManager.getValue('systemErrorMessage1').replace("{{@emoji}}", emoji.get(contentManager.getValue("sweatFaceEmoji"))));

            setTimeout(() => {
                msgFormat.sendTextMessage(senderID, contentManager.getValue('systemErrorMessage2').replace("{{@bankURL}}", contentManager.getValue('bankURL')));
            }, 1000);
            break;

        case 1:
            msgFormat.sendTextMessage(senderID, contentManager.getValue('systemErrorMessage3').replace("{{@bankPhone}}", contentManager.getValue('bankPhone')).replace("{{@emoji}}", emoji.get(contentManager.getValue("sweatFaceEmoji"))));
            break;


        case 2:
            msgFormat.sendTextMessage(senderID, contentManager.getValue('systemErrorMessage4').replace("{{@bankPhone}}", contentManager.getValue('bankPhone')).replace("{{@emoji}}", emoji.get(contentManager.getValue("sweatFaceEmoji"))));
            break;
    }
}

async function sendKeepNotificationsOff(userContext) {

    const contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());
    let senderID = userContext.getUserId();
    msgFormat.sendTextMessage(senderID, contentManager.getValue('keepNotificationsOff'));
    setTimeout(()=>{
        sendShowOptions(userContext, contentManager.getValue('optionsTextMessage'));
    }, 1000);
}

async function sendThumbsUpAndMenu(userContext) {

    const contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());
    msgFormat.sendTextMessage(userContext.getUserId(), emoji.get(contentManager.getValue("soundsGoodQR1Emoji")));

    setTimeout(()=>{
        sendShowOptions(userContext);
    }, 1000)
}

async function sendAttachmentUnsupported(userContext) {

    const contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());
    setTimeout(()=>{
        msgFormat.sendTextMessage(userContext.getUserId(), contentManager.getValue('attachmentErrorMessage').replace("{{@attachmentEmoji1}}", emoji.get(contentManager.getValue("speak_no_evil_emoji"))).replace("{{@attachmentEmoji2}}", emoji.get(contentManager.getValue("hear_no_evil_emoji"))));
    }, 1000)
}

async function sendJokeMessage(userContext) {

    const contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());
    let senderID = userContext.getUserId();

    let randomIndex = utilities.getRandomNumber(2);

    console.log(`Sending Joke Message ${randomIndex}`);

    switch (randomIndex) {

        case 0:
            msgFormat.sendTextMessage(senderID, contentManager.getValue('joke1').replace("{{@emoji}}", emoji.get(contentManager.getValue("joyFaceEmoji"))));

            setTimeout(() => {
                msgFormat.sendTextMessage(senderID, contentManager.getValue('joke1_1').replace("{{@emoji}}", emoji.get(contentManager.getValue("joyFaceEmoji"))));
            }, 2000);
            break;

        case 1:
            msgFormat.sendTextMessage(senderID, contentManager.getValue('joke2').replace("{{@emoji}}", emoji.get(contentManager.getValue("joyFaceEmoji"))));

            setTimeout(() => {
                msgFormat.sendTextMessage(senderID, contentManager.getValue('joke2_1').replace("{{@emoji}}", emoji.get(contentManager.getValue("joyFaceEmoji"))));
            }, 2000);
            break;


        case 2:
            msgFormat.sendTextMessage(senderID, contentManager.getValue('joke3').replace("{{@emoji}}", emoji.get(contentManager.getValue("joyFaceEmoji"))));

            setTimeout(() => {
                msgFormat.sendTextMessage(senderID, contentManager.getValue('joke3_1').replace("{{@emoji}}", emoji.get(contentManager.getValue("joyFaceEmoji"))));
            }, 2000);
            break;
    }
}