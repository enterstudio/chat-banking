/**
 * Created by mayujain on 8/8/17.
 */

const httpStatus = require('http-status');
const moment = require('moment');
const ctcSDK = require('../apiSdk/ctcSdk');
const dcasSDK = require('../apiSdk/dcasSdk');
const vdpSDK = require('../apiSdk/pavSdk');
const userInterface = require('../db/userInterface');
const templates = require('../messages');
const utilities = require('../utilities');
const config = require('../resources/configuration.json');


const SANDBOX_ENABLED = config['SANDBOX_ENABLED'];
const PAV_SANDBOX_CARD_NUMBER = config['CARD_VALIDATION_API']['TEST_CARD']['NUMBER'];
const PAV_SANDBOX_CARD_EXPIRY_YEAR = config['CARD_VALIDATION_API']['TEST_CARD']['EXPIRY_YEAR'];
const PAV_SANDBOX_CARD_EXPIRY_MONTH = config['CARD_VALIDATION_API']['TEST_CARD']['EXPIRY_MONTH'];
const PAV_SANDBOX_CARD_CVV = config['CARD_VALIDATION_API']['TEST_CARD']['CVV'];
const PAV_SANDBOX_CARD_ZIPCODE = config['CARD_VALIDATION_API']['TEST_CARD']['ZIPCODE'];
const DCAS_SANDBOX_TEST_CARD = config['DCAS_API']['SANDBOX_TEST_CARD'];
const UserContext = require("../models/UserContext");

const enrollCard = async(data, httpResponse) => {

    let fbId = data.fb_user_id; //get fb_user_id from webview

    // get user's profile info from facebook
    let fbProfile = await utilities.getFacebookProfile(fbId);
    console.log({fbProfile});

    let userContext = new UserContext(fbId, fbProfile.locale);

    console.log(`\nStarting Card Enrollment for user: ${fbProfile.first_name} ${fbProfile.last_name}`);

    let isCardNumberValid = (data.card_number.match(/^[0-9]+$/) && data.card_number.length == 16);
    let isDateValid = moment(data.expiry_month+"/"+data.expiry_year, "MM/YYYY, true").isValid();
    let isCVVValid = (data.cvv.match(/^[0-9]+$/) && data.cvv.length == 3);
    let isZipCodeValid = (data.zipCode.match(/^[0-9]+$/) && data.zipCode.length == 5);

    try {
        if(!(isCardNumberValid && isDateValid && isCVVValid && isZipCodeValid)) {
            throw({"message":"Invalid Data."});
        }

        let card;
        if (SANDBOX_ENABLED)
            card = {
                card_number: PAV_SANDBOX_CARD_NUMBER,
                expiry_year: PAV_SANDBOX_CARD_EXPIRY_YEAR,
                expiry_month: PAV_SANDBOX_CARD_EXPIRY_MONTH,
                cvv: PAV_SANDBOX_CARD_CVV,
                zipCode: PAV_SANDBOX_CARD_ZIPCODE,
            };
        else
            card = {
                card_number: data.card_number,
                expiry_year: data.expiry_year,
                expiry_month: data.expiry_month,
                cvv: data.cvv,
                zipCode: data.zipCode,
            };

        //validate card details
        const validationResponse = await vdpSDK.validateCard(card);

        //delete card information
        card = null;

        console.log({validationResponse});
        console.log("\n");

        if (vdpSDK.validateResponseCodes(validationResponse)) {

            console.log("Validated Card successfully.");

            let encryptedPAN = await utilities.encryptRSA(data.card_number);

            //get CTC documentID for the card number
            let ctc_response = await ctcSDK.createDocumentId(encryptedPAN);

            console.log("\n");
            console.log({ctc_response});

            if (SANDBOX_ENABLED)  // Use DCAS sandbox test card number
                encryptedPAN = await utilities.encryptRSA(DCAS_SANDBOX_TEST_CARD);

            let dcas_response = await dcasSDK.createDocumentId(encryptedPAN);

            console.log({dcas_response});

            if (ctc_response && ctc_response.document_id !== undefined &&
                dcas_response && dcas_response.document_id !== undefined &&
                fbProfile) {

                const last4DigitsOfCard = data.card_number.substring(data.card_number.length - 4);

                let userObj = {
                    user_id: fbId,
                    first_name: fbProfile.first_name,
                    last_name: fbProfile.last_name,
                    gender: fbProfile.gender,
                    timezone: fbProfile.timezone,
                    locale: fbProfile.locale,
                    card: last4DigitsOfCard,
                    ctc_document_id: ctc_response.document_id,
                    dcas_document_id: dcas_response.document_id
                };

                //save user profile info, timestamp, last4 digits of card_number, document-id, notifications flag(default true) in database
                await userInterface.saveOrUpdateUser(userObj);

                //set global alert for $0.01 amount on CTC
                const set_alert_response = await ctcSDK.setAlert({
                    "amount": 0.01,
                    "type": "global",
                    "user_id": fbId,
                    "ctc_document_id": ctc_response.document_id
                });

                console.log("\n");
                console.log({set_alert_response});

                httpResponse.status(httpStatus.OK).send({"success": true });

                templates.sendSuccessCardEnrollment(userContext, fbProfile.first_name);
            } else
                throw new Error("\nEnrollment Error: Could not get document-id from service.\n");
        }
        else {
            console.log("\n");
            throw new Error("\nEnrollment Error: Could not verify card details using PAV API.\n");
        }
        data = null;
    }
    catch (error) {

        if(error.message)
            console.error(error.message);
        else if (error)
            console.error(error);

        httpResponse.status(httpStatus.BAD_REQUEST).send({"success": false, first_name: fbProfile.first_name});

        // templates.sendFailedCardEnrollment(userContext, fbProfile.first_name);
        data = null;
    }

};

module.exports = {
    enrollCard
};
