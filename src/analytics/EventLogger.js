/**
 * Created by akakade on 9/26/17.
 */
"use strict";
var request = require('request');

class EventLogger {

    constructor(){
        this.url = "https://graph.facebook.com/1649415711790852/activities";
        this.pageId = 1729065574066511;
    }

    logEvent(eventName, userId){

        console.log("Sending analytics", eventName, userId);
        request.post({
            url : this.url,
            form: {
                event: 'CUSTOM_APP_EVENTS',
                custom_events: JSON.stringify([{
                    _eventName: eventName,
                    _logTime: Math.floor(new Date() / 1000)
                }]),
                advertiser_tracking_enabled: 0,
                application_tracking_enabled: 0,
                extinfo: JSON.stringify(['mb1']),
                page_id: this.pageId,
                page_scoped_user_id: userId
            }
    }, function(err,httpResponse,body){
            console.error(err);
            console.log(httpResponse.statusCode);
            console.log(body);
        });

    }

}

module.exports = EventLogger;