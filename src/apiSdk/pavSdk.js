/**
 * Created by mayujain on 9/29/17.
 */
/**
 * Created by mayujain on 8/7/17.
 */

const request = require('request');
const fs = require('fs');
const path = require('path');
const httpStatus = require('http-status');
const config = require('../resources/configuration.json');
const _ = require('underscore');
const app = require('../main');
const KeyStore = app.get('KeyStore');
const utilities = require('../utilities');

const VDP_USER_ID = KeyStore.get('VDP_USER_ID');
const VDP_PASSWORD = KeyStore.get('VDP_PASSWORD');
const VDP_API_HOST = config['VDP_API']['HOST'];
const CARD_VALIDATION_API_URl = config['CARD_VALIDATION_API']['URL'];
const VDP_API_KEY_FILE_NAME = config['VDP_API']['KEY_FILE_NAME'];
const VDP_API_CERTIFICATE_FILE_NAME = config['VDP_API']['CERTIFICATE_FILE_NAME'];
const keyFilePath = path.join(__dirname, '../resources/' + VDP_API_KEY_FILE_NAME);
const certFilePath = path.join(__dirname, '../resources/' + VDP_API_CERTIFICATE_FILE_NAME);

function validateCard(card) {

    return new Promise((resolve, reject) => {

        if (validateCardDetails(card)) {

            console.log("Validating Card Details with PAV API.");

            let headers = {};
            headers['Authorization'] = 'Basic ' + new Buffer(VDP_USER_ID + ':' + VDP_PASSWORD).toString('base64');
            headers['x-correlation-id'] = utilities.getRandomString('_FbChatBot');
            headers['Accept'] = ['application/json'];
            headers['Content-Type'] = ['application/json'];

            if (0 < card.expiry_month && card.expiry_month < 10 && card.expiry_month.length == 1)
                card.expiry_month = "0" + card.expiry_month;

            request({
                url: VDP_API_HOST + CARD_VALIDATION_API_URl,
                method: 'POST',
                json: {
                    "cardCvv2Value": card.cvv,
                    "cardExpiryDate": card.expiry_year + "-" + card.expiry_month,
                    "primaryAccountNumber": card.card_number,
                    "addressVerificationResults": {
                        "postalCode": card.zipCode,
                        "street": "abc abc"
                    },
                },
                key: fs.readFileSync(keyFilePath),
                cert: fs.readFileSync(certFilePath),
                headers: headers
            }, function (error, response) {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(response.body);
                }
            });
        }
        else
            reject({
                "error": "Bad Request. Missing card details",
                "statusCode": httpStatus.BAD_REQUEST
            })
    });
}

// Validate PAV response codes for acceptance
function validateResponseCodes(response) {

    // Card Validation Response Acceptable ResponseCodes
    let successCodes = {
        "responseCodes": ['5', 'C'],
        "cvv2ResultCodes": ['M'],
        "actionCodes": ['00', '11', '85'],
        "addressVerificationResults": ['A', 'D', 'F', 'Y', 'Z', 'M', 'P']
    };

    return (
        _.contains(successCodes.responseCodes, response.responseCode) &&
        _.contains(successCodes.cvv2ResultCodes, response.cvv2ResultCode) &&
        _.contains(successCodes.actionCodes, response.actionCode) &&
        _.contains(successCodes.addressVerificationResults, response.addressVerificationResults)
    )
}

function validateCardDetails(card) {
    return (
        utilities.isDefined(card.cvv) &&
        utilities.isDefined(card.card_number) &&
        utilities.isDefined(card.expiry_month) &&
        utilities.isDefined(card.expiry_year) &&
        utilities.isDefined(card.zipCode)
    )
}

module.exports = {
    validateCard,
    validateResponseCodes,
    validateCardDetails
};