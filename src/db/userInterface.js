/**
 * Created by mayujain on 8/15/17.
 */

import {Users} from '../models/models.index';


module.exports = {
    saveOrUpdateUser,
    findUser,
    deleteUser
};

//Save or Update Users
function saveOrUpdateUser(obj) {
    return new Promise((resolve, reject) => {
        Users
            .findOrCreate({
                where: {
                    user_id: obj.user_id
                },
                defaults: {
                    first_name: obj.first_name,
                    last_name: obj.last_name,
                    gender: obj.gender,
                    locale: obj.locale,
                    timezone: obj.timezone,
                    card: obj.card,
                    notifications: obj.notifications,
                    ctc_document_id: obj.ctc_document_id,
                    dcas_document_id: obj.dcas_document_id,
                    bank_identifier: obj.bank_identifier,
                }
            })
            .spread((user, created) => {

                if (created) { // successfully created new item in cart
                    user = user.toJSON();
                    let datetime = new Date().toISOString();
                    user.createdAt = datetime;
                    user.updatedAt = datetime;
                    resolve(user);

                } else { // user already exist, need to update notifications
                    return Users
                        .update({
                            notifications: obj.notifications
                        }, {
                            where: {
                                user_id: user.user_id
                            },
                            fields: ['notifications'],
                            validate: true,
                            limit: 1
                        })
                        .then((results) => {
                            if (results[0] === 1) {
                                user.notifications = obj.notifications;
                                resolve(user);
                            } else
                                reject({"message": 'Failed to update user notifications, user does not exist.'})
                        })
                        .catch(err => {
                            console.log(`ERROR updating user : SQL ${err.message} ${JSON.stringify(err.errors)}`);
                            reject({"message": `ERROR updating user : SQL ${err.message} ${JSON.stringify(err.errors)}`})
                        });
                }
            })
            .catch(err => {
                console.log(`ERROR finding user : SQL ${err.message} ${JSON.stringify(err.errors)}`);
                reject({"message": `ERROR finding user : SQL ${err.message} ${JSON.stringify(err.errors)}`})
            });
    });
}


function findUser(userId) {
    return new Promise((resolve, reject) => {
        Users
            .findOne({
                where: {
                    user_id: userId
                }
            })
            .then(user => {
                if (user !== null) {
                    user = user.toJSON();
                    resolve(user);
                }
                else {
                    resolve(null);
                }
            })
            .catch((err) => {
                console.log(`ERROR finding User : SQL ${err.message} ${JSON.stringify(err.errors)}`);
                resolve(null);
            });
    });
}

function deleteUser(userId) {
    return new Promise((resolve, reject) => {
        Users
            .destroy({
                where: {
                    user_id: userId
                }
            })
            .then(response => {

                if (response > 0) {
                    resolve(response);
                } else {
                    reject(response);
                }
            })
            .catch((err) => {
                console.log(`ERROR deleting User : SQL ${err.message} ${JSON.stringify(err.errors)}`);
                reject(err);
            });
    });
}
