/**
 * Created by akakade on 9/30/17.
 */

"use strict";

class UserContext {

    constructor(userId, locale){
        this.userId = userId;
        this.locale = locale;
    }

    getUserId() {
        return this.userId;
    }

    getLocale() {
        return this.locale;
    }

    setUserId(userId) {
        this.userId = userId;
    }

    setLocale(locale) {
        this.locale = locale;
    }
}


module.exports = UserContext;