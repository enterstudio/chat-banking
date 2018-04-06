/**
 * Created by mayujain on 9/3/17.
 */

const request = require('request');
const httpStatus = require('http-status');
const config = require('../resources/configuration.json');

const utilities = require('../utilities');
const DCAS_API_DOMAIN = config['DCAS_API']['HOST'];
const DCAS_BASE_URL = config['DCAS_API']['BASE_URL'];
const DCAS_CARDS_ENDPOINT = config['DCAS_API']['CARDS'];
const DCAS_BALANCES_ENDPOINT = config['DCAS_API']['BALANCES'];
const BANK_IDENTIFIER = config['BANK_IDENTIFIER'];

module.exports = {
    createDocumentId,
    getAccountBalance
};

function createDocumentId(instrumentation_id) {

    return new Promise((resolve, reject) => {

        let options = {
            url: DCAS_API_DOMAIN + DCAS_BASE_URL + DCAS_CARDS_ENDPOINT,
            method: 'POST',
            headers: {
                'on-behalf-of': BANK_IDENTIFIER,
                'ex-correlation-id': utilities.getRandomString('_FbChatBot')
            },
            qs: {
                'encrypted': true
            },
            json: {
                "instrumentation_id": instrumentation_id,
                "instrumentation_type": "card_number"
            }
        };

        request(options, function (error, response, body) {
            if (error) {
                console.error("Error creating DCAS document_id" + error);
                reject({
                    error: error,
                    statusCode: response.statusCode
                })
            }
            else {
                if (response.statusCode == httpStatus.CREATED) {
                    resolve({
                        "document_id": response.body.card_id
                    });
                }
                else {
                    reject({
                        error: response.body,
                        statusCode: response.statusCode
                    })
                }
            }
        });
    });
}

function getAccountBalance(document_id) {

    return new Promise((resolve, reject) => {

        console.log("Fetching Account Balance");

        let options = {
            url: DCAS_API_DOMAIN + DCAS_BASE_URL + DCAS_CARDS_ENDPOINT + "/" + document_id + DCAS_BALANCES_ENDPOINT,
            method: 'GET',
            headers: {
                'on-behalf-of': BANK_IDENTIFIER,
                'ex-correlation-id': utilities.getRandomString('_FbChatBot')
            }
        };

        request(options, function (error, response) {
            if (error) {
                reject(error);
            }
            else if (response && response.statusCode) {

                if (response.statusCode == httpStatus.CREATED) {

                    console.log("Successfully fetched Account Balance");

                    resolve({
                        response: response.body,
                        statusCode: response.statusCode
                    });
                } else {

                    console.error("Failed to fetched Account Balance");

                    reject({
                        response: response.body,
                        statusCode: response.statusCode
                    })
                }
            }
        });
    });
}
