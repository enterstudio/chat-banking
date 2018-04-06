/**
 * Created by mayujain on 8/15/17.
 */

import { sequelize } from '../db/mysqlConnection';

let Users = sequelize.import(__dirname + "/user");

module.exports = {
    Users
};
