import { Sequelize, DataTypes } from 'sequelize';
import { STATE } from './constants.js';

export { Op } from 'sequelize';

const setupSequelize = () => {
    if (process.env.DATABASE_TYPE) {
        return new Sequelize(process.env.DATABASE_NAME, process.env.DATABASE_USERNAME, process.env.DATABASE_PASSWORD, {
            host: process.env.DATABASE_HOST,
            dialect: process.env.DATABASE_TYPE,
            logging: false,
            query: { raw: true },
        });
    }

    return new Sequelize({
        dialect: 'sqlite',
        logging: false,
        query: { raw: true },
        storage: `${process.cwd()}/data/db.${process.env.NODE_ENV || 'development'}.sqlite`,
        retry: { max: 5 },
    });
};

export const sequelize = setupSequelize();

export const User = sequelize.define('user', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    firstName: { type: Sequelize.STRING },
    lastName: { type: Sequelize.STRING },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
}, { paranoid: true });

export const App = sequelize.define('app', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.VIRTUAL,
        get() {
            return this.getDataValue('releaseName')?.replace(/\d+$/g, '').toLowerCase();
        },
        set() {
            throw new Error('Do not try to set the `name` value!');
        },
    },
    releaseName: { type: DataTypes.STRING, unique: true, allowNull: false },
    state: { type: DataTypes.STRING, allowNull: false, defaultValue: STATE.STANDBY },
    responseTime: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    domain: { type: DataTypes.STRING, unique: true, allowNull: false },
    commit: { type: DataTypes.STRING },
});

export const Env = sequelize.define('env', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    value: { type: DataTypes.TEXT },
}, {
    timestamps: false,
    uniqueKeys: {
        env_name_app_unique: {
            fields: ['name', 'appId'],
        },
    },
});

User.hasMany(App);
App.belongsTo(User);
App.hasMany(Env);
Env.belongsTo(App);

User.sync();
App.sync();
Env.sync();
