/**
 * Created by mayujain on 8/7/17.
 */

const request = require('request');
const httpStatus = require('http-status');
const utilities = require('../utilities');
const app = require('../main');
const KeyStore = app.get('KeyStore');

const config = require('../resources/configuration.json');
const CTC_HOST = config['CTC_API']['HOST'];
const CTC_DOCUMENT_ENDPOINT = config['CTC_API']['DOCUMENT_ENDPOINT'];
const CTC_ALERTS_ENDPOINT = config['CTC_API']['ALERTS_ENDPOINT'];
const BANK_IDENTIFIER = config['BANK_IDENTIFIER'];


module.exports = {
    createDocumentId,
    setAlert,
    deleteDocumentId,
    getAlerts,
    updateAlert,
    deleteAlert
};

function createDocumentId(instrumentation_id) {

    return new Promise((resolve, reject) => {

        request({
            url: CTC_HOST + CTC_DOCUMENT_ENDPOINT,
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
        }, function (error, response) {
            if (error) {
                console.error("Error creating CTC document_id" + error);
                reject(error);
            }
            else {
                resolve(response.body);
            }
        });
    });
}

function deleteDocumentId(document_id) {

    return new Promise((resolve, reject) => {

        request({
            url: CTC_HOST + CTC_DOCUMENT_ENDPOINT + "/" + document_id,
            method: 'DELETE',
            headers: {
                'on-behalf-of': BANK_IDENTIFIER,
                'ex-correlation-id': utilities.getRandomString('_FbChatBot')
            },
        }, function (error, response) {
            if (error) {
                console.error("ERROR: deleting CTC document_id : " + error);
                reject(error);
            }
            else {
                if (response.statusCode == httpStatus.NO_CONTENT) {
                    resolve({
                        "status_code": response.statusCode,
                        "success": true
                    });
                }
                else {
                    reject(response.body);
                }
            }
        });
    });
}

function setAlert(alert) {

    return new Promise((resolve, reject) => {

        request({
            url: CTC_HOST + CTC_ALERTS_ENDPOINT,
            method: 'POST',
            headers: {
                'on-behalf-of': BANK_IDENTIFIER,
                'ex-correlation-id': utilities.getRandomString('_FbChatBot'),
                'on-behalf-of-user': alert.user_id,
                'document-id': alert.ctc_document_id
            },
            json: {
                "amount_limit": alert.amount,
                "alert_type": alert.type,
                "merchant_type": alert.merchant_type
            },
        }, function (error, response) {
            if (error) {
                console.log(`ERROR: Failed to set alert.`);
                console.log(error);
                reject(error);
            }
            else if (response && response.statusCode) {
                if (response.statusCode == httpStatus.CREATED) {
                    resolve({
                        response: response.body,
                        statusCode: response.statusCode
                    });
                } else {
                    console.log(`ERROR: Failed to set alert.`);
                    reject({
                        response: response.body,
                        statusCode: response.statusCode
                    })
                }
            }
        });
    });
}

function getAlerts(user) {

    return new Promise((resolve, reject) => {

        request({
            url: CTC_HOST + CTC_ALERTS_ENDPOINT,
            method: 'GET',
            headers: {
                'on-behalf-of': BANK_IDENTIFIER,
                'ex-correlation-id': utilities.getRandomString('_FbChatBot'),
                'on-behalf-of-user': user.user_id,
                'document-id': user.ctc_document_id
            }
        }, function (error, response) {
            if (error) {
                console.log(`ERROR: Failed to get alert settings.`);
                console.log(error);
                reject(error);
            }
            else if (response && response.statusCode) {

                if (response.statusCode == httpStatus.OK) {
                    resolve({
                        response: response.body,
                        statusCode: response.statusCode
                    });
                } else {
                    console.log(`ERROR: Failed to get alert settings.`);
                    reject({
                        response: response,
                        statusCode: response.statusCode
                    })
                }
            }
        });
    });
}

function updateAlert(alert) {

    return new Promise((resolve, reject) => {

        console.log("Updating alert for user: " + alert.user_id);
        console.log({alert});

        let requestUrl = CTC_HOST + CTC_ALERTS_ENDPOINT + "/" + alert.type;

        if (alert.type == "merchant")
            requestUrl = requestUrl + "/" + alert.merchant_type;

        request({
            url: requestUrl,
            method: 'PUT',
            headers: {
                'on-behalf-of': BANK_IDENTIFIER,
                'ex-correlation-id': utilities.getRandomString('_FbChatBot'),
                'on-behalf-of-user': alert.user_id,
                'document-id': alert.ctc_document_id
            },
            json: {
                "amount_limit": alert.amount,
            },
        }, function (error, response) {
            if (error) {
                console.error(`ERROR: Failed to update alert.`);
                console.error(error);
                reject(error);
            }
            else if (response && response.statusCode) {
                if (response.statusCode == httpStatus.OK) {
                    resolve({
                        response: response.body,
                        statusCode: response.statusCode
                    });
                } else {
                    console.error(`ERROR: Failed to update alert.`);
                    reject({
                        response: response.body,
                        statusCode: response.statusCode
                    })
                }
            }
        });
    });
}

function deleteAlert(alert) {

    return new Promise((resolve, reject) => {

        console.log("Deleting alert for user: " + alert.user_id);
        console.log({alert});

        let requestUrl = CTC_HOST + CTC_ALERTS_ENDPOINT + "/" + alert.type;

        if (alert.type == "merchant")
            requestUrl = requestUrl + "/" + alert.merchant_type;

        request({
            url: requestUrl,
            method: 'DELETE',
            headers: {
                'on-behalf-of': BANK_IDENTIFIER,
                'ex-correlation-id': utilities.getRandomString('_FbChatBot'),
                'on-behalf-of-user': alert.user_id,
                'document-id': alert.ctc_document_id
            },
        }, function (error, response) {
            if (error) {
                console.error(`ERROR: Failed to delete alert.`);
                console.error(error);
                reject(error);
            }
            else if (response && response.statusCode) {
                if (response.statusCode == httpStatus.NO_CONTENT || response.statusCode == httpStatus.NOT_FOUND) {
                    resolve({
                        response: response.body,
                        statusCode: httpStatus.NO_CONTENT
                    });
                }
                else if (response.statusCode == httpStatus.BAD_REQUEST || response.statusCode == httpStatus.NOT_FOUND) {
                    resolve({
                        response: response.body,
                        statusCode: httpStatus.BAD_REQUEST
                    });
                }
                else {
                    console.error(`ERROR: Failed to delete alert.`);
                    reject({
                        response: response.body,
                        statusCode: response.statusCode
                    })
                }
            }
        });
    });
}

