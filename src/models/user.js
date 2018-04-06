/**
 * Created by mayujain on 8/15/17.
 */

const config = require('../resources/configuration.json');
const BANK_IDENTIFIER = config['BANK_IDENTIFIER'];

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('user', {
        id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.STRING(65),
            allowNull: false,
            unique: true
        },
        first_name: {
            type: DataTypes.STRING(25),
            allowNull: false
        },
        last_name: {
            type: DataTypes.STRING(25),
            allowNull: false
        },
        gender: {
            type: DataTypes.ENUM('male', 'female'),
            allowNull: false,
        },
        locale: {
            type: DataTypes.STRING(10),
            allowNull: false
        },
        timezone: {
            type: DataTypes.STRING(25),
            allowNull: true,
            defaultValue: '-7'
        },
        card: {
            type: DataTypes.INTEGER(4),
            allowNull: false,
            validate: {isNumeric: true}
        },
        notifications: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        ctc_document_id: {
            type: DataTypes.STRING(45),
            allowNull: false,
            unique: true
        },
        dcas_document_id: {
            type: DataTypes.STRING(45),
            allowNull: false
        },
        bank_identifier:{
            type: DataTypes.STRING(45),
            allowNull: true,
            defaultValue: BANK_IDENTIFIER
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('NOW()')
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('NOW()')
        }
    }, {
        tableName: 'user',
        instanceMethods: {
            toJSON: function () {
                let values = this.get();
                delete values.id;
                delete values.id;
                return values;
            }
        }
    }, {
        indexes: [{unique: true, fields: ['user_id', 'document_id']}]
    });
};
