/**
 * Created by mayujain on 10/12/17.
 */

'use strict';

const request = require('request');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const _ = require('underscore');

const VIEWS_DIRECTORY_PATH = "../../views/";
const RESOURCES_DIRECTORY_PATH = "../resources/";
const S3_CONFIG_FILE_URL = process.env.CONFIG_PATH;
const parameterStore = require('../parameterStore');

if (process.env.NODE_ENV == "development") {
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


module.exports = {
    loadConfigurationFromS3,
    getObjectFromS3BucketAndWriteToDisk,
};

/**
 * Fetch list of configuration objects(files) from AWS S3  bucket
 * */
function loadConfigurationFromS3(KeyStore, callback) {
    try {

        if (process.env.NODE_ENV == 'development') {

            console.log("\nReading Application config locally.\n");

            KeyStore.set('MESSENGER_APP_ID', process.env.MESSENGER_APP_ID);
            KeyStore.set('MESSENGER_PAGE_ID', process.env.MESSENGER_PAGE_ID);
            KeyStore.set('MESSENGER_APP_SECRET', process.env.MESSENGER_APP_SECRET);
            KeyStore.set('MESSENGER_PAGE_ACCESS_TOKEN', process.env.MESSENGER_PAGE_ACCESS_TOKEN);
            KeyStore.set('MESSENGER_VALIDATION_TOKEN', process.env.MESSENGER_VALIDATION_TOKEN);
            KeyStore.set('APIAI_ACCESS_TOKEN', process.env.APIAI_ACCESS_TOKEN);
            KeyStore.set('SERVER_URL', process.env.SERVER_URL);
            KeyStore.set('VDP_USER_ID', process.env.VDP_USER_ID);
            KeyStore.set('VDP_PASSWORD', process.env.VDP_PASSWORD);
            KeyStore.set('DB_HOSTNAME', process.env.DB_HOSTNAME);
            KeyStore.set('DB_NAME', process.env.DB_NAME);
            KeyStore.set('DB_USERNAME', process.env.DB_USERNAME);
            KeyStore.set('DB_PASSWORD', process.env.DB_PASSWORD);

            callback(null, 'Loaded Environment Variables Locally');

        }
        else if (S3_CONFIG_FILE_URL == undefined || S3_CONFIG_FILE_URL == "") {
            throw new Error("S3_CONFIG_FILE_URL missing in environment.")
        }
        else {
            console.log("\nFetching Application Configuration Files from AWS S3.");
            let pathArray = S3_CONFIG_FILE_URL.split('/');
            let pathLength = pathArray.length;
            let listObjectsParams = {
                Bucket: pathArray[pathLength - 3],
                Prefix: `${pathArray[pathLength - 2]}/${pathArray[pathLength - 1]}/`,
                Marker: `${pathArray[pathLength - 2]}/${pathArray[pathLength - 1]}/`,
            };

            console.log("\nRequesting list of objects from S3 bucket.");
            console.log(listObjectsParams);

            s3.listObjects(listObjectsParams, function (err, data) {

                if (err) {
                    console.log(err); // an error occurred
                    throw new Error("Error fetching list of objects from S3.");
                }
                else {
                    console.log("\nFetching objects from S3 bucket list.");

                    let promises = _.map(data.Contents, async(keys) => {

                        let filePath, params, keyName;

                        /**
                         * If Object is a directory then fetch the file from that directory
                         */
                        if ((keys.Key.split('/').length) > pathLength && keys.Key.split('/')[pathLength] !== '') {

                            keyName = keys.Key.split('/')[pathLength];
                            params = {
                                Bucket: S3_CONFIG_FILE_URL + "/" + keys.Key.split('/')[pathLength - 1],
                                Key: keyName
                            };
                            filePath = path.join(__dirname, VIEWS_DIRECTORY_PATH + keyName);
                        }

                        /**
                         * If Object is a file then fetch it directly
                         * */
                        else if ((keys.Key.split('/').length) == pathLength) {

                            keyName = keys.Key.split('/')[pathLength - 1];
                            params = {
                                Bucket: S3_CONFIG_FILE_URL,
                                Key: keyName
                            };
                            filePath = path.join(__dirname, RESOURCES_DIRECTORY_PATH + keyName);
                        }

                        if (keyName !== undefined && filePath !== undefined) {
                            // console.log("length: " + keys.Key.split('/').length + " Key: " + keys.Key.split('/'));
                            return getObjectFromS3BucketAndWriteToDisk(params, filePath);
                        }

                    });


                    /**
                     * promises is an array of promise objects. Promise.all waits for all promise to be fulfilled.
                     * */
                    Promise.all(promises)
                        .then(values => {

                            if (values.length > 1) {

                                /**
                                 * After configuration file is downloaded from S3 bucket;
                                 * Read configuration file and load keyStore from AWS Parameter Store
                                 * */
                                console.log("\nLoading applications keys from AWS ParameterStore...");

                                setTimeout(() => {
                                    getKeysFromParamStore(KeyStore, callback);
                                }, 1000);
                            }
                        })
                        .catch(error => {
                            console.log(error);
                            throw new Error("Did not load all objects from S3 bucket.")
                        });
                }
            });
        }
    }
    catch (error) {
        console.error("\nError: Failed to load Application Configuration from AWS S3. \n");
        console.error(error);
        callback(error);
        process.exit(1);
    }
}

/**
 * Fetch files from S3 bucket and save to disk
 * */
function getObjectFromS3BucketAndWriteToDisk(params, filePath) {

    return new Promise((resolve, reject) => {

        s3.getObject(params, function (err, data) {

            if (err) {
                console.log("\nError in getting object from S3 Bucket.\n");
                console.log(err);
                reject(err)
            }
            else {
                fs.writeFile(filePath, data.Body.toString(), (err, response) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    else {
                        console.log("Saved: " + filePath);
                        resolve(filePath);
                    }
                });
            }
        });
    });
}

const getKeysFromParamStore = async(KeyStore, callback) => {

    try {
        const config = require('../resources/configuration.json');
        let appKeys = config['appKeys'];
        let serviceKeys = config['serviceKeys'];
        try {
            await parameterStore.saveToKeyStore(appKeys, KeyStore);
            await parameterStore.saveToKeyStore(serviceKeys, KeyStore);

            console.log("\nSaved application keys from AWS Parameter Store.\n");
            callback(null, 'Loaded Environment Variables From AWS Parameter Store');
        }
        catch (error) {
            throw new Error(error);
        }
    }
    catch (error) {
        console.error("\nError fetching Environment Variables from AWS Parameter Store. Exiting Server.");
        console.error(error);
        throw new Error(error);
    }
};