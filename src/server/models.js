import Sequelize from 'sequelize';
import fs from 'fs';

const DB_FILE = process.env.NODE_ENV === 'test' ? 'test.sqlite' : 'db.sqlite';
const DB_DIR = 'data/';
const DB_PATH = `${DB_DIR}/${DB_FILE}`;

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);

const db = `sqlite://${DB_PATH}`;
export const sequelize = new Sequelize(db, { logging: false, operatorsAliases: Sequelize.Op });

export const User = sequelize.define('user', {
    ip: { type: Sequelize.STRING, validate: { isIP: true } },
    email: { type: Sequelize.STRING, validate: { isEmail: true } },
    password: { type: Sequelize.STRING },
    stripeCustomerId: { type: Sequelize.STRING },
    isSubscribed: { type: Sequelize.BOOLEAN, defaultValue: false },
    isAdmin: { type: Sequelize.BOOLEAN, defaultValue: false },
});

export const Settings = sequelize.define('settings', {
    name: { type: Sequelize.STRING },
    value: { type: Sequelize.STRING },
});

export const Application = sequelize.define('application', {
    releaseName: { type: Sequelize.STRING },
    domainName: { type: Sequelize.STRING },
    state: { type: Sequelize.STRING },
    action: { type: Sequelize.STRING },
    port: { type: Sequelize.STRING },
    error: { type: Sequelize.STRING },
});

export const Package = sequelize.define('package', {
    name: { type: Sequelize.STRING },
    icon: { type: Sequelize.STRING },
    category: { type: Sequelize.STRING },
    stackFileUrl: { type: Sequelize.STRING },
    enabled: { type: Sequelize.BOOLEAN, defaultValue: true },
});

Application.User = Application.belongsTo(User);
User.Applications = User.hasMany(Application);
Application.Package = Application.belongsTo(Package);
Package.Applications = Package.hasMany(Application);

User.sync();
Application.sync();
Package.sync();
Settings.sync();
