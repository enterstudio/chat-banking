/**
 * Created by mayujain on 9/3/17.
 */

const httpStatus = require('http-status');
const _ = require('underscore');

const dcasSDK = require('../apiSdk/dcasSdk');
const msgFormat = require('../handlers/msg.send.handlers/msg.send');
const userInterface = require('../db/userInterface');
let ContentManager = require("../content/ContentManager");
const templates = require("../messages");
const utilities = require('../utilities');

const getAccountBalance = async(userContext) => {

    let contentManager = new ContentManager();
    await contentManager.loadContent(userContext.getLocale());

    try {
        const user = await userInterface.findUser(userContext.getUserId());
        if (user && user.dcas_document_id !== undefined) {

            let response = await dcasSDK.getAccountBalance(user.dcas_document_id);
            response = JSON.parse(response.response);
            console.log(JSON.stringify(response, null, 4));

            if (utilities.isDefined(response) && utilities.isDefined(response.balances) && response.balances.length > 0) {

                let creditAccount = _.find(response.balances, (account)=>{
                     return account.type == "Credit"
                    });

                let prepaidAccount = _.find(response.balances, (account)=>{
                    return account.type == "Prepaid"
                });

                /*
                * Get balance from Credit Account Type
                * */
                if(utilities.isDefined(creditAccount)) {

                    if (isCreditBalanceAvailable(creditAccount))
                        msgFormat.sendTextMessage(userContext.getUserId(),
                            contentManager
                                .getValue("accountBalanceForCredit")
                                .replace("{{@available_credit}}", creditAccount.available_credit.amount)
                                .replace("{{@available_credit_currency}}", creditAccount.available_credit.currency)
                                .replace("{{@amount_owing}}", creditAccount.amount_owing.amount)
                                .replace("{{@amount_owing_currency}}", creditAccount.amount_owing.currency));

                    else if (isCreditBalanceAvailableInLedger(creditAccount))
                        msgFormat.sendTextMessage(userContext.getUserId(),
                            contentManager
                                .getValue("accountBalanceForCredit")
                                .replace("{{@available_credit}}", creditAccount.available.amount)
                                .replace("{{@available_credit_currency}}", creditAccount.available.currency)
                                .replace("{{@amount_owing}}", creditAccount.ledger.amount)
                                .replace("{{@amount_owing_currency}}", creditAccount.ledger.currency));
                }

                /*
                 * Get balance from Prepaid Account Type if Credit not available
                 * */
                else if(utilities.isDefined(prepaidAccount) && utilities.isDefined(prepaidAccount.available.amount)){
                    msgFormat.sendTextMessage(userContext.getUserId(),
                        contentManager
                            .getValue("accountBalanceForPrepaid")
                            .replace("{{@available_amount}}", prepaidAccount.available.amount)
                            .replace("{{@available_amount_currency}}", prepaidAccount.available.currency));
                }

                /*
                 * Balance not available in Credit or Prepaid type; send balance unavailable message
                 * */
                else {
                    console.log("Unexpected Account Type");
                    throw new Error("Account Balance not available.");
                }
            }

            /*
             * If API response does not have balances at all.
             * */
            else {
                console.log("Response does not have balance.");
                throw new Error("Account Balance not available.");
            }
        }
    }
    catch (error) {
        console.error("\nError Fetching Account Balance.");
        console.error(error);
        templates.sendSystemErrorMessage(userContext);
    }
};

function isCreditBalanceAvailable(account) {
    return utilities.isDefined(account.available_credit) && utilities.isDefined(account.available_credit.amount) && utilities.isDefined(account.amount_owing) && utilities.isDefined(account.amount_owing.amount);  //ledger
}

function isCreditBalanceAvailableInLedger(account) {
    return utilities.isDefined(account.available) && utilities.isDefined(account.available.amount) && utilities.isDefined(account.ledger) && utilities.isDefined(account.ledger.amount);
}

module.exports = {
    getAccountBalance,
};
