/**
 * Created by mayujain on 9/23/17.
 */

const request = require('request');
const fs = require('fs');
const path = require('path');
const httpStatus = require('http-status');
const config = require('../resources/configuration.json');
const TNS_API_HOST = config['TNS_API']['HOST'];
const TNS_ITINERARY_URL = config['TNS_API']['ITINERARY_URL'];
const BANK_IDENTIFIER = config['BANK_IDENTIFIER'];
const utilities = require('../utilities');

class TravelNotificationService {

    constructor(card_number, departure_date, return_date, destinations) {
        this.instrumentation_id = card_number;
        this.departure_date = departure_date;
        this.return_date = return_date;
        this.destinations = destinations;
    }

    createItinerary(user_id) {

        return new Promise((resolve, reject) => {

            let options = {
                url: TNS_API_HOST + TNS_ITINERARY_URL,
                method: 'POST',
                json: {
                    "instrumentation_id": this.instrumentation_id,
                    "departure_date": this.departure_date,
                    "return_date": this.return_date,
                    "destinations": this.destinations
                },
                headers: {
                    'on-behalf-of': BANK_IDENTIFIER,
                    'ex-correlation-id': utilities.getRandomString('_FbChatBot'),
                    'on-behalf-of-user': user_id,
                    'content-type': 'application/json'
                }
            };

            request(options, (error, response) => {
                    if (error) {
                        console.error("Error Creating Travel Notification Itinerary.");
                        reject(error);
                    }
                    else {
                        if (response.statusCode == httpStatus.CREATED) {
                            resolve(response.body);
                        }
                        else {
                            reject({
                                error: response.body,
                                statusCode: response.statusCode
                            })
                        }
                    }
                }
            );
        });
    }

    static getItinerary(user_id, pan) {

        return new Promise((resolve, reject) => {

            let options = {
                url: TNS_API_HOST + TNS_ITINERARY_URL,
                method: 'GET',
                headers: {
                    'on-behalf-of': BANK_IDENTIFIER,
                    'ex-correlation-id': utilities.getRandomString('_FbChatBot'),
                    'on-behalf-of-user': user_id,
                    'content-type': 'application/json',
                    'instrumentation-id': pan
                }
            };
            console.log(options);
            request(options, (error, response) => {
                    if (error) {
                        console.error("Error fetching Travel Notification Itineraries.");
                        console.log(error);
                        reject(error);
                    }
                    else {
                        response.body = JSON.parse(response.body);

                        if (response.statusCode == httpStatus.OK && utilities.isDefined(response.body.itineraries)) {
                            resolve(response.body.itineraries);
                        }
                        else {
                            reject({
                                error: response.body,
                                statusCode: response.statusCode
                            })
                        }
                    }
                }
            );
        });
    }

}

module.exports = TravelNotificationService;