/**
 * Created by mayujain on 9/24/17.
 */

const uuid = require('node-uuid');
const apiai = require('apiai');
let app = require('./main');
let KeyStore = app.get('KeyStore');
const APIAI_ACCESS_TOKEN = KeyStore.get('APIAI_ACCESS_TOKEN');

let apiAiService = apiai(APIAI_ACCESS_TOKEN, {language: "en", requestSource: "fb"});


let apiaiResponse;

class NlpAgent {

    constructor(senderID) {
        this.senderID = senderID;
    }

    sendTextToAgent(text) {

        // console.log({ nlpQuery : text});

        if (!KeyStore.has(this.senderID))
            KeyStore.set(this.senderID, uuid.v1());

        apiaiResponse = apiAiService.textRequest(text, {sessionId: KeyStore.get(this.senderID)});

        return apiaiResponse;
    }
}

module.exports = NlpAgent;