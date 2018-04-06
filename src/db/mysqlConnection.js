/**
 * Created by mayujain on 08/15/17.
 */

const Sequelize = require('sequelize');
let app = require('../main');
let KeyStore = app.get('KeyStore');
const db_user =  KeyStore.get('DB_USERNAME');
const db_password =  KeyStore.get('DB_PASSWORD');
const db_host =  KeyStore.get('DB_HOSTNAME');
const db_schema =  KeyStore.get('DB_NAME');

let sequelize = new Sequelize( db_schema, db_user, db_password, {
    host: db_host,
    dialect: 'mysql',
    logging: false,
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    }

});

sequelize
    .authenticate()
    .then(function (err) {
        console.log({"MySQL_Connection_Status": true});
    })
    .catch(function (err) {
        console.log({
            "MySQL_Connection_Status": false,
            "error": err.message
        });
    });


module.exports = {sequelize};
