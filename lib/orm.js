import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

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
});

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
    state: { type: DataTypes.STRING, allowNull: false, defaultValue: 'standby' },
    responseTime: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    domain: { type: DataTypes.STRING, unique: true, allowNull: false },
});

export const Env = sequelize.define('env', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    value: { type: DataTypes.STRING },
}, { timestamps: false });

export const initDatabase = async () => {
    const password = await bcrypt.hash('myp@ssw0rd', 10);
    const user = await User.create({ email: 'contact+test@ethibox.fr', password }, { raw: false });
    const updatedAt = new Date(new Date().getTime() - 5 * 60 * 1000);
    await user.createApp({ releaseName: 'wordpress1', domain: 'wordpress1.localhost', updatedAt }, { silent: true });
    const app = await user.createApp({ releaseName: 'peertube1', domain: 'peertube1.localhost', updatedAt }, { silent: true });

    const { templates } = await fetch(process.env.TEMPLATES_URL).then((r) => r.json());
    const template = templates.find((t) => t.title.toLowerCase() === app.name);
    const envs = (template?.env || []).filter((e) => e.preset !== true) || [];

    for await (const env of envs) {
        await Env.create({ name: env.name, value: env.value, appId: app.id });
    }

    const token = jwt.sign({ email: 'contact+test@ethibox.fr' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return { ...user.toJSON(), token };
};

export const resetDatabase = async () => {
    await sequelize.drop();
    await sequelize.sync({ force: true });
};

User.hasMany(App);
App.belongsTo(User);
App.hasMany(Env);
Env.belongsTo(App);

User.sync();
App.sync();
Env.sync();
