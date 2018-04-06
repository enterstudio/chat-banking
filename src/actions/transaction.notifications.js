/**
 * Created by mayujain on 8/13/17.
 */

const _ = require('underscore');
const moment = require('moment');

const utilities = require('../utilities');
const templates = require('../messages');
const userInterface = require('../db/userInterface');
const merchantSearchSDK = require('../apiSdk/merchantSearch');
const config = require('../resources/configuration.json');
const MERCHANT_SEARCH = config['MERCHANT_SEARCH'];
const merchantCountryCode = config['MERCHANT_SEARCH_API']['COUNTRY_CODE'];
const merchantSearchSuccessCode = config['MERCHANT_SEARCH_API']['SUCCESS_CODE'];
const merchantSearchFailedCode = config['MERCHANT_SEARCH_API']['FAILURE_CODE'];
const ContentManager = require('../content/ContentManager');
const UserContext = require('../models/UserContext');

const sendAlert = async(alert) => {

    const userId = alert.user_id;
    const transactionAmount = alert.transaction_amount;
    const cardLast4 = alert.card_number.substring(alert.card_number.length - 4);
    const transactionTimestamp = alert.timestamp;
    let merchant = {};

    if (alert.merchant_info) {

        merchant.merchantName = (alert.merchant_info.name) ? alert.merchant_info.name : "";
        merchant.merchantStreetAddress = (alert.merchant_info.address_lines && alert.merchant_info.address_lines[0]) ? alert.merchant_info.address_lines[0] : "";
        merchant.merchantCity = (alert.merchant_info.city) ? alert.merchant_info.city : "";
        merchant.merchantState = (alert.merchant_info.region) ? alert.merchant_info.region : "";
        merchant.merchantPostalCode = (alert.merchant_info.postal_code) ? alert.merchant_info.postal_code : "";
        merchant.merchantPhoneNumber = (alert.merchant_info.merchant_phone_number) ? alert.merchant_info.merchant_phone_number : "";
        merchant.merchantCountryCode = (alert.merchant_info.country_code) ? alert.merchant_info.country_code : "";
    }

    const user = await userInterface.findUser(userId);

    if (user && user.user_id !== undefined && user.notifications == true) {

        let userContext = new UserContext(userId, user.locale);
        const contentManager = new ContentManager();
        await contentManager.loadContent(userContext.getLocale());

        try {
            //convert time to user't timezone
            const convertedDateTime = utilities.convertTimeToUsersTimezone(user.timezone, transactionTimestamp);
            let date = convertedDateTime.date;
            let time = convertedDateTime.time;

            if (MERCHANT_SEARCH) {
                let merchantSearchResponse = await merchantSearchSDK.getMerchantInfo(merchant);
                let merchantSearchStatusCode = (merchantSearchResponse && merchantSearchResponse.merchantSearchServiceResponse.status.statusCode) ? merchantSearchResponse.merchantSearchServiceResponse.status.statusCode : "";

                console.log({merchantSearchStatusCode});

                //if success api show details
                if (merchantSearchStatusCode == merchantSearchSuccessCode && merchantSearchResponse.merchantSearchServiceResponse.response.length == 1 && merchantSearchResponse.merchantSearchServiceResponse.response) {

                    let merchantInfo = merchantSearchResponse.merchantSearchServiceResponse.response[0]["responseValues"];

                    console.log({merchantInfo});

                    if (utilities.isDefined(merchantInfo.visaStoreName))
                        merchant.merchantName = merchantInfo.visaStoreName;
                    else if (utilities.isDefined(merchantInfo.visaMerchantName))
                        merchant.merchantName = merchantInfo.visaMerchantName;

                    if (utilities.isDefined(merchantInfo.merchantStreetAddress))
                        merchant.merchantStreetAddress = merchantInfo.merchantStreetAddress;

                    if (utilities.isDefined(merchantInfo.merchantCity))
                        merchant.merchantCity = merchantInfo.merchantCity;

                    if (utilities.isDefined(merchantInfo.merchantState))
                        merchant.merchantState = merchantInfo.merchantState;

                    if (utilities.isDefined(merchantInfo.merchantPostalCode))
                        merchant.merchantPostalCode = merchantInfo.merchantPostalCode;

                    if (utilities.isDefined(merchantInfo.merchantCountryCode))
                        merchant.merchantCountryCode = merchantCountryCode;

                    if (utilities.isDefined(merchantInfo.merchantPhoneNumber) && merchantInfo.merchantPhoneNumber.length > 0 && ( utilities.isDefined(merchantInfo.merchantPhoneNumber[0]["number"])))
                        merchant.merchantPhoneNumber = merchantInfo.merchantPhoneNumber[0]["number"];

                    composeAndSendPayload(merchant, date, time, transactionAmount, cardLast4, userContext, contentManager)
                }
                //If merchant info not found - don't provide merchant details
                else if (merchantSearchStatusCode == merchantSearchFailedCode) {
                    if (addressAvailable(merchant))
                        sendBasicNotification(userContext, contentManager, cardLast4, merchant, transactionAmount, date, time);
                    else
                        composeAndSendPayload(merchant, date, time, transactionAmount, cardLast4, userContext, contentManager);
                }
            }
            else {
                if (addressAvailable(merchant))
                    sendBasicNotification(userContext, contentManager, cardLast4, merchant, transactionAmount, date, time);
                else {
                    composeAndSendPayload(merchant, date, time, transactionAmount, cardLast4, userContext, contentManager);
                }
            }
        }
        catch
            (error) {
            console.log("\nError sending Transaction Alert: ");
            console.error(error);
        }
    }
};

const sendAlertDetails = async(userContext, payload) => {

    try {
        templates.showAlertDetails(userContext, payload);
    }
    catch (error) {
        console.log("\nError sending Transaction Alert Details: ");
        console.error(error);
    }
};

async function composeAndSendPayload(merchant, date, time, transactionAmount, cardLast4, userContext, contentManager) {

    let alertPayload = "SEND_ALERT_" + contentManager.getValue("merchantDetailsText") +`${cardLast4} \n\n${merchant.merchantName} \n$${transactionAmount} \n\n`;

    if (utilities.isDefined(date) && utilities.isDefined(time))
        alertPayload += `${date} ${time}\n\n`;

    if (utilities.isDefined(merchant.merchantStreetAddress))
        alertPayload += `${merchant.merchantStreetAddress}\n`;

    if (utilities.isDefined(merchant.merchantCity))
        alertPayload += `${merchant.merchantCity}`;

    if (utilities.isDefined(merchant.merchantState))
        alertPayload += `, ${merchant.merchantState}. `;

    if (utilities.isDefined(merchant.merchantPostalCode))
        alertPayload += merchant.merchantPostalCode;

    // if (utilities.isDefined(merchant.merchantCountryCode))
    //     alertPayload += `\n\n${merchant.merchantCountryCode}`;

    if (utilities.isDefined(merchant.merchantPhoneNumber))
        alertPayload += `\n\n${merchant.merchantPhoneNumber}`;

    let text = contentManager.getValue("transactionAlertMessage").replace("{{@cardLast4}}", cardLast4).replace("{{@merchantName}}", merchant.merchantName).replace("{{@transactionAmount}}", transactionAmount).replace("{{@date}}", date).replace("{{@time}}", time);
    templates.sendAlertToUser(userContext, text, true, alertPayload);
}

async function sendBasicNotification(userContext, contentManager, cardLast4, merchant, transactionAmount, date, time) {
    let text = contentManager.getValue("transactionAlertMessage").replace("{{@cardLast4}}", cardLast4).replace("{{@merchantName}}", merchant.merchantName).replace("{{@transactionAmount}}", transactionAmount).replace("{{@date}}", date).replace("{{@time}}", time);
    templates.sendAlertToUser(userContext, text, false);
}

function addressAvailable(merchant) {
    return merchant.merchantName !== "" && merchant.merchantStreetAddress == "" && merchant.merchantCity == "" && merchant.merchantState == "" && merchant.merchantPostalCode == "";
}

module.exports = {
    sendAlert,
    sendAlertDetails
};