/**
 * Created by mayujain on 8/16/17.
 */

import {sequelize} from '../db/mysqlConnection';

function initializeDataBaseForceFully(req, res) {

    return new Promise((resolve, reject)=>{

        try{
            sequelize
                .sync({force: true})
                .then(function (r) {

                    resolve({
                        status: "success",
                        message: "Database synced successfully."
                    });

                }, function (err) {

                    console.log(err);

                    reject({
                        success: false,
                        message: "Failed to syncing database.",
                        error: err
                    });

                });
        }
        catch (error){
            console.error("Error syncing database");
            console.error(error);
            reject(error);
        }

    });
}

module.exports = {
    initializeDataBaseForceFully
};
