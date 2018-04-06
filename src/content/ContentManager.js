/**
 * Created by akakade on 9/21/17.
 */
"use strict";

const xml2js = require('xml2js');
const fs = require('fs');
const parser = new xml2js.Parser();
const _ = require('underscore');
const path = require('path');

class ContentManager {

    constructor() {
            this.language = "";
            this.content = {};
    }

    loadContent(locale) {

        const self = this;

        return new Promise((resolve, reject) => {

            if(locale.startsWith("en")){
                this.language = "en";
            }
            else{
                this.language = "en";
            }
            const contentFileName = "messages_" + this.language + ".xml";

            const contentFilePath = path.join(__dirname, "../resources/", contentFileName);

            fs.readFile(contentFilePath, (err, data) => {

                if (err) reject(err);

                parser.parseString(data, function (error, result) {

                    if (error) {
                        console.error("Error parsing Content Manager XML file.");
                        console.error(error);
                        reject(err);
                    }
                    else {
                        self.content = result.resources.string;
                        resolve();
                    }
                });
            });
        });

    }

    getValue(key) {

        let result = _.find(this.content, function (entry) {
            return entry.$.name == key;
        });
        return result == undefined ? "CONTENT_ERROR" : result._;

    }

}

module.exports = ContentManager;
