/**
 * Created by mayujain on 8/15/17.
 */

const _ = require('underscore');
let AWS = require('aws-sdk');

if(process.env.NODE_ENV == "development"){
    AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: 'us-east-1'
    });
}
else {
    AWS.config.update({
        region: 'us-east-1'
    });
}


let ssm = new AWS.SSM();

function putKV(params) {

    ssm.putParameter(params, function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
    });
}

function getKV(param) {

    return new Promise((resolve, reject) => {

        ssm.getParameter({
            Name: param,
            WithDecryption: true
        }, function (err, data) {
            if (err) {
                console.log("Error accessing parameter store");
                reject(err);
            }
            else {
                resolve(data.Parameter.Value);
            }
        });
    });
}


function getKVArray(params) {

    return new Promise((resolve, reject) => {

        ssm.getParameters({
            Names: params,
            WithDecryption: true
        }, function (err, data) {
            if (err) {
                console.log("Error accessing parameter store");
                reject(err);
            }
            else {
                resolve(data.Parameters);
            }
        });
    });
}

function saveToKeyStore(keys, KeyStore) {

    return new Promise((resolve, reject) => {

        let params = _.map(keys, (key) => {
            return key;
        });

        getKVArray(params)
            .then(values => {

                _.each(values, (value) => {

                    let keyNameArray = value.Name.split('/');
                    let key = keyNameArray[keyNameArray.length-1];
                    let val = value.Value;
                    // console.log(key + " : " + val);
                    KeyStore.set(key, val);
                });

                resolve(KeyStore);
            })
            .catch(error => {
                console.log("Error storing KeyValues in KeyStore.");
                reject(error);
            });
    });
}


module.exports = {
    getKV,
    putKV,
    getKVArray,
    saveToKeyStore
};