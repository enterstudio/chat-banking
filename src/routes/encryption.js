/**
 * Created by mayujain on 10/10/17.
 */

const httpStatus = require('http-status');
const utilities = require('../utilities');

module.exports = {
    decryptMessage,
    encryptMessage
};

async function decryptMessage(req, res) {
    try {
        console.log(req.body);
        const response = await utilities.decryptRSA(req.body.msg);
        res.status(httpStatus.OK).send(response);
    }
    catch (error) {
        res.status(httpStatus.BAD_REQUEST).send(error);
    }
}

async function encryptMessage(req, res) {
    try {
        console.log(req.body);
        const response = await utilities.encryptRSA(req.body.msg);
        res.status(httpStatus.OK).send(response);
    }
    catch (error) {
        res.status(httpStatus.BAD_REQUEST).send(error);
    }
}