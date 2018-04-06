/**
 * Created by mayujain on 8/15/17.
 */

const templates = require('../messages');
const msgFormat = require('../handlers/msg.send.handlers/msg.send');
const utilities = require('../utilities');
const userInterface = require('../db/userInterface');
const UserContext = require('../models/UserContext');
const ContentManager = require('../content/ContentManager');


const sendWelcomeMessage = async(senderID) => {

    try {
        let fbProfile = await utilities.getFacebookProfile(senderID);

        const user = await userInterface.findUser(senderID);

        let userContext = new UserContext(senderID, fbProfile.locale);
        let contentManager = new ContentManager();
        await contentManager.loadContent(userContext.getLocale());

        if (!user || user === null) {

            msgFormat.sendTextMessage(senderID, contentManager.getValue("welcomeMessage1").replace("{{@first_name}}", fbProfile.first_name));

            setTimeout(() => {
                msgFormat.sendTextMessage(senderID, contentManager.getValue("welcomeMessage2"))
            }, 500);

            setTimeout(() => {
                templates.sendEnrollCardButton(userContext);
            }, 900);

        }
        else {
            msgFormat.sendTextMessage(senderID, contentManager.getValue("welcomeMessage1").replace("{{@first_name}}", fbProfile.first_name));

            setTimeout(() => {
                templates.sendMainMenu(userContext);
            }, 500);
        }
    }
    catch (error) {
        console.error(`Error sending Welcome Message: ${error}`);
    }
};

module.exports = {
    sendWelcomeMessage
};