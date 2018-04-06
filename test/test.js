/**
 * Created by mayujain on 5/1/17.
 */

import 'babel-polyfill'
process.env.NODE_ENV = "test";
const httpStatus = require('http-status');
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../src/main');
let should = chai.should();
let expect = chai.expect();
// let assert = chai.assert;
let assert = require('assert');
// chai.use(require('chai-json-schema'));
chai.use(chaiHttp);

describe('FaceBook-Chatbot-Service', () => {
    /*
     * Test the /GET route
     */
    describe('GET /ping', () => {
        it('it should return ' + httpStatus.OK, (done) => {
            chai.request(server)
                .get('/ping')
                .end((err, res) => {
                    res.should.have.status(httpStatus.OK);
                    done();
                });
        });
    });

});
