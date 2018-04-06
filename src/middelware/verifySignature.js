/**
 * Created by mayujain on 7/11/17.
 */

const crypto = require('crypto');
const app = require('../main');
const KeyStore = app.get('KeyStore');
const MESSENGER_APP_SECRET = KeyStore.get('MESSENGER_APP_SECRET');
const SERVER_URL = KeyStore.get('SERVER_URL');
const config = require('../resources/configuration.json');
const CTC_API_DOMAIN = config['CTC_API']['HOST'];
const httpStatus = require('http-status');

module.exports = {
    /*
     * Verify that the callback came from Facebook. Using the App Secret from
     * the App Dashboard, we can verify the signature that is sent with each
     * callback in the x-hub-signature field, located in the header.
     * https://developers.facebook.com/docs/graph-api/webhooks#setup
     */
    verifyRequestSignature: (req, res, buf) => {

        // console.log({headers: req.headers});
        let host;
        if (req.headers.origin || req.headers.host){
            host = req.headers.origin || req.headers.host;
        }
        // console.log("Received Request from Host: " + host);
        // console.log(req.headers);

        if (host !== undefined && (host === SERVER_URL || host === CTC_API_DOMAIN || host === 'localhost:5000')) {
            // skip white listed domains
            // console.log("Received Request from (Whitelisted) URL: " + host);
        }
        else {
            let signature = req.headers["x-hub-signature"];
            if (!signature) {
                console.error("Couldn't validate incoming message signature.");
            } else {
                let elements = signature.split('=');
                let method = elements[0];
                let signatureHash = elements[1];

                let expectedHash = crypto.createHmac('sha1', MESSENGER_APP_SECRET)
                    .update(buf)
                    .digest('hex');

                if (signatureHash != expectedHash) {
                    throw new Error("Couldn't validate the request signature coming from " + host);
                }
            }
            res.status(httpStatus.BAD_REQUEST);
        }
    }
};