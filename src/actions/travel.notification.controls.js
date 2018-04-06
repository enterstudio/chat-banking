/**
 * Created by mayujain on 9/22/17.
 */

const _ = require('underscore');
const utilities = require('../utilities');
const app = require('../main');
const KeyStore = app.get('KeyStore');
const apiai = require('apiai');
const request = require('request');
const uuid = require('node-uuid');
const moment = require('moment');

const config = require('../resources/configuration.json');
const userInterface = require('../db/userInterface');
const templates = require('../messages');
const msgFormat = require('../handlers/msg.send.handlers/msg.send');
const TNS = require('../apiSdk/TravelNotificationService');
const TNS_TEST_CARD_NUMBER = config['TNS_API']['TEST_CARD_NUMBER'];
const ContentManager = require('../content/ContentManager');
const SANDBOX_ENABLED = config['SANDBOX_ENABLED'];
const countryCodeLookup = require('country-data').lookup;


const triggerTravelNotificationIntent = async(userContext) => {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());
    let senderID = userContext.getUserId();

    try {
        if (!KeyStore.has(senderID))
            KeyStore.set(senderID, uuid.v1());

        const nlpQueryResponse = await utilities.sendQueryToNlpAgent(KeyStore.get(senderID), "NOTIFY_BANK_OF_TRAVEL");

        console.log({createApiaiQuery: nlpQueryResponse});

        if (utilities.isDefined(nlpQueryResponse.result)) {

            let apiIntent = nlpQueryResponse.result;

            console.log(JSON.stringify(apiIntent, null, 4));

            if (apiIntent.fulfillment && apiIntent.fulfillment.speech != "") {
                msgFormat.sendTextMessage(senderID, apiIntent.fulfillment.speech);
            }
        }
    }
    catch (error) {
        console.error("\nError while Triggering Travel Notification Intent from NOTIFY_BANK_OF_TRAVEL postback event");
        console.error(error);
        templates.sendSystemErrorMessage(userContext);
    }
};

const createTravelNotification = async(userContext, contexts) => {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    try {
        // console.log(JSON.stringify(contexts, null, 4));
        if (utilities.isDefined(contexts) && contexts.length > 0) {
            _.each(contexts, async(context) => {

                if (context.name === "createitinerary") {

                    let countries = context.parameters.country;
                    let start_date = context.parameters.start_date;
                    let end_date = context.parameters.end_date;

                    let start_date_time = new Date(start_date);
                    let end_date_time = new Date(end_date);

                    if (start_date_time > end_date_time) {
                        msgFormat.sendTextMessage(userContext.getUserId(), contentManager.getValue("travelNotificationWrongDatesErrorMessage"));
                        triggerTravelNotificationIntent(userContext);
                    }
                    else
                        await createItineraryOnTNS(userContext, start_date, end_date, countries);
                }
            })
        }
    }
    catch (error) {
        console.error("\nError while Creating Travel Notification");
        console.error(error);
        templates.sendSystemErrorMessage(userContext);
    }
};

/**
 * Create itinerary on TNS API
 * */
const createItineraryOnTNS = async(userContext, start_date, end_date, countries) => {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());
    let senderID = userContext.getUserId();
    const user = await userInterface.findUser(senderID);

    if (user && utilities.isDefined(user.user_id)) {

        let countryEmojiList = [];

        let destinations = _.map(countries, country => {

            let lookup = countryCodeLookup.countries({name: country})[0];

            if (utilities.isDefined(lookup)) {

                console.log({country, countryCode: lookup.alpha3, flag: lookup.emoji});

                countryEmojiList.push(`${country} ${lookup.emoji}`);

                return {country: lookup.alpha3}
            }
        });

        let itinerary, encryptedPAN;

        if (SANDBOX_ENABLED)
            encryptedPAN = TNS_TEST_CARD_NUMBER;
        //TODO -- send encrypted card number to TNS API. TNS API not updated yet to read encrypted card number
        // encryptedPAN = await utilities.encryptRSA(TNS_TEST_CARD_NUMBER);
        else
            encryptedPAN = await utilities.encryptRSA(card_number);

        itinerary = new TNS(encryptedPAN, start_date, end_date, destinations);

        console.log(`\nCreating itinerary on TNS for user: ${user.first_name} ${user.last_name}`);

        if (utilities.isDefined(itinerary)) {

            const createItineraryResponse = await itinerary.createItinerary(senderID);

            console.log({create_Itinerary_Response: createItineraryResponse});

            let departure_date = moment(itinerary.departure_date).format('MM/DD/YYYY');
            let return_date = moment(itinerary.return_date).format('MM/DD/YYYY');

            msgFormat.sendTextMessage(senderID, contentManager.getValue("createTravelNotificationMessage1").replace("{{@countryEmojiList}}", countryEmojiList).replace("{{@departure_date}}", departure_date).replace("{{@return_date}}", return_date));

            setTimeout(()=>{
                templates.sendShowOptions(userContext);
            }, 1200);
        }
    }
};

const showItineraryAndConfirmation = async(userContext, contexts) => {

    if (utilities.isDefined(contexts) && contexts.length > 0) {
        _.each(contexts, async(ctx) => {

            if (ctx.name === "createitinerary") {

                let contentManager = new ContentManager();
                await contentManager.loadContent(userContext.getLocale());
                let senderID = userContext.getUserId();

                let countries = ctx.parameters.country;
                let start_date = ctx.parameters.start_date;
                let end_date = ctx.parameters.end_date;
                let countryEmojiList = [];

                start_date = moment(start_date).format('MM/DD/YYYY');
                end_date = moment(end_date).format('MM/DD/YYYY');

                let start_date_time = new Date(start_date);
                let end_date_time = new Date(end_date);

                if (start_date_time > end_date_time) {
                    msgFormat.sendTextMessage(userContext.getUserId(), contentManager.getValue("travelNotificationWrongDatesErrorMessage"));
                    triggerTravelNotificationIntent(userContext); //restart travel notification creation flow
                }
                else {
                    _.each(countries, country => {

                        let lookup = countryCodeLookup.countries({name: country})[0];

                        if (utilities.isDefined(lookup)) {
                            countryEmojiList.push(`${country} ${lookup.emoji}`);
                        }
                        else {
                            countryEmojiList.push(country);
                        }
                    });

                    msgFormat.sendTextMessage(senderID, contentManager.getValue("travelItinerary").replace("{{@countryEmojiList}}", countryEmojiList).replace("{{@start_date}}", start_date).replace("{{@end_date}}", end_date));

                    setTimeout(() => {
                        templates.sendAskConfirmationForTravelItineraryQuickReply(userContext);
                    }, 1500);
                }
            }
        })
    }
};

const getTravelNotifications = async(userContext) => {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());
    let senderID = userContext.getUserId();

    try {

        const user = await userInterface.findUser(senderID);

        if (user && user.user_id !== undefined) {

            let itinerary, pan;

            if (SANDBOX_ENABLED)
                pan = TNS_TEST_CARD_NUMBER;

            let itineraries = await TNS.getItinerary(senderID, pan);

            /**
             * Show itineraries if available
             * */
            if (itineraries.length > 0) {

                msgFormat.sendTextMessage(senderID, contentManager.getValue("getTravelNotificationMessage1"));

                let destinations, messagePayload = "";

                _.each(itineraries, (itinerary) => {

                    destinations = _.map(itinerary.destinations, (dest) => {

                        let lookup = countryCodeLookup.countries({alpha3: dest.country})[0];

                        if (utilities.isDefined(lookup)) {
                            // console.log({country: lookup.name, countryCode: lookup.alpha3, flag: lookup.emoji});
                            return `${lookup.name} ${lookup.emoji}`;
                        }
                        else
                            return dest.country;
                    });

                    itinerary.departure_date = moment(itinerary.departure_date).format('MM/DD/YYYY');
                    itinerary.return_date = moment(itinerary.return_date).format('MM/DD/YYYY');

                    messagePayload += `\n${destinations} \n${itinerary.departure_date} - ${itinerary.return_date}\n`;
                });

                if (utilities.isDefined(messagePayload)) {

                    setTimeout(() => {
                        msgFormat.sendTextMessage(senderID, contentManager.getValue("getTravelNotificationMessage2").replace("{{$0}}", messagePayload));
                    }, 1000);

                    setTimeout(() => {
                        templates.sendShowOptions(userContext);
                    }, 2000);
                }
            }

            /**
             * No itineraries created. Ask if you want to create one.
             * */
            else {
                templates.sendEmptyTravelItineraryQuickReply(userContext);
            }
        }
    }
    catch (error) {
        console.error("\nError while Fetching Travel Notification");
        console.error(error);
        templates.sendSystemErrorMessage(userContext);
    }
};

module.exports = {
    triggerTravelNotificationIntent,
    createTravelNotification,
    getTravelNotifications,
    showItineraryAndConfirmation
};