import crypto from 'node:crypto';
import { Sequelize, DataTypes } from 'sequelize';
import { STATE } from './constants.js';

export { Op } from 'sequelize';

const getKey = () => crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'mys3cr3t').digest();

const encrypt = (val) => {
    if (!val) return val;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(val), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
};

const decrypt = (val) => {
    if (!val?.includes(':')) return val;
    try {
        const [iv, tag, data] = val.split(':');
        const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(iv, 'hex'), { authTagLength: 16 });
        decipher.setAuthTag(Buffer.from(tag, 'hex'));
        return Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]).toString();
    } catch { return val; }
};

const setupSequelize = () => {
    if (process.env.DATABASE_TYPE) {
        return new Sequelize(process.env.DATABASE_NAME, process.env.DATABASE_USERNAME, process.env.DATABASE_PASSWORD, {
            host: process.env.DATABASE_HOST,
            dialect: process.env.DATABASE_TYPE,
            logging: false,
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000,
            },
            dialectOptions: {
                connectTimeout: 60000,
            },
            retry: { max: 5 },
        });
    }

    return new Sequelize({
        dialect: 'sqlite',
        logging: false,
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
    value: {
        type: DataTypes.TEXT,
        get() {
            return decrypt(this.getDataValue('value'));
        },
    },
}, {
    timestamps: false,
    uniqueKeys: {
        env_name_app_unique: {
            fields: ['name', 'appId'],
        },
    },
    hooks: {
        beforeSave: (env) => {
            const name = env.getDataValue('name')?.toUpperCase();
            if (env.changed('value') && name && /PASSWORD|SECRET|KEY|TOKEN|SALT|CREDENTIALS/.test(name)) {
                env.setDataValue('value', encrypt(env.getDataValue('value')));
            }
        },
    },
});

User.hasMany(App);
App.belongsTo(User);
App.hasMany(Env);
Env.belongsTo(App);

await sequelize.sync();
