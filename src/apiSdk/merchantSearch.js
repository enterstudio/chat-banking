/**
 * Created by mayujain on 8/24/17.
 */


const request = require('request');
const fs = require('fs');
const path = require('path');
const httpStatus = require('http-status');
const moment = require('moment');
const app = require('../main');
const KeyStore = app.get('KeyStore');

const utilities = require('../utilities');
const config = require('../resources/configuration.json');
const VDP_USER_ID = KeyStore.get('VDP_USER_ID');
const VDP_PASSWORD = KeyStore.get('VDP_PASSWORD');
const VDP_API_HOST = config['VDP_API']['HOST'];
const MERCHANT_SEARCH_API_URL = config['MERCHANT_SEARCH_API']['URL'];
const MERCHANT_SEARCH_COUNTRY_CODE = config['MERCHANT_SEARCH_API']['COUNTRY_CODE'];
const MERCHANT_SEARCH_RESPONSE_ATTR_LIST = config['MERCHANT_SEARCH_API']['RESPONSE_ATTR_LIST'];
const VDP_API_KEY_FILE_NAME = config['VDP_API']['KEY_FILE_NAME'];
const VDP_API_CERTIFICATE_FILE_NAME = config['VDP_API']['CERTIFICATE_FILE_NAME'];
const keyFilePath = path.join(__dirname, '../resources/' + VDP_API_KEY_FILE_NAME);
const certFilePath = path.join(__dirname, '../resources/' + VDP_API_CERTIFICATE_FILE_NAME);

function getMerchantInfo(merchant) {

    return new Promise((resolve, reject) => {

        try {

            if (merchant.merchantName !== '') {

                let headers = {};
                headers['Authorization'] = 'Basic ' + new Buffer(VDP_USER_ID + ':' + VDP_PASSWORD).toString('base64');
                headers['Accept'] = ['application/json'];
                headers['Content-Type'] = ['application/json'];

                let data = {
                    "header": {
                        "messageDateTime": utilities.getFormattedDate(),
                        "requestMessageId": utilities.getRandomString('_FbChatBot'),
                        "startIndex": "0"
                    },
                    "searchAttrList": {
                        "merchantName": merchant.merchantName,
                        "merchantStreetAddress": merchant.merchantStreetAddress,
                        "merchantCity": merchant.merchantCity,
                        "merchantState": merchant.merchantState,
                        "merchantPostalCode": merchant.merchantPostalCode,
                        "merchantCountryCode": MERCHANT_SEARCH_COUNTRY_CODE //Country Code can only be 840 (USA) as per VDP API Documentation
                    },
                    "responseAttrList": MERCHANT_SEARCH_RESPONSE_ATTR_LIST
                };

                console.log("Merchant Search Request body: ");
                console.log(data);

                request({
                    url: VDP_API_HOST + MERCHANT_SEARCH_API_URL,
                    method: 'POST',
                    json: data,
                    key: fs.readFileSync(keyFilePath),
                    cert: fs.readFileSync(certFilePath),
                    headers: headers
                }, function (error, response) {
                    if (error) {
                        console.log(`Error in Merchant Search API.`);
                        reject(error);
                    }
                    else {
                        console.log("Merchant Search Response body: ");
                        console.log(response.body);
                        resolve(response.body);
                    }
                });
            }
            else {
                reject({
                    "error": "Bad Request. Missing Merchant Details",
                    "statusCode": httpStatus.BAD_REQUEST
                })
            }

        }
        catch (error) {
            console.log(error);
            reject(error)
        }

    });
}

module.exports = {
    getMerchantInfo
};