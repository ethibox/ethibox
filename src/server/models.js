import Sequelize from 'sequelize';
import os from 'os';
import fs from 'fs';

const DB_FILE = 'db.sqlite';
const DB_DIR = `${os.homedir()}/.ethibox/`;
const DB_PATH = `${DB_DIR}/${DB_FILE}`;

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);

const db = `sqlite://${DB_PATH}`;
export const sequelize = new Sequelize(db, { logging: (process.env.NODE_ENV !== 'production'), operatorsAliases: Sequelize.Op });

export const User = sequelize.define('user', {
    ip: { type: Sequelize.STRING, validate: { isIP: true } },
    email: { type: Sequelize.STRING, validate: { isEmail: true } },
    password: { type: Sequelize.STRING },
});

export const Application = sequelize.define('application', {
    releaseName: { type: Sequelize.STRING },
    domainName: { type: Sequelize.STRING },
    state: { type: Sequelize.STRING },
    action: { type: Sequelize.STRING },
    ip: { type: Sequelize.STRING },
    port: { type: Sequelize.STRING },
    error: { type: Sequelize.STRING },
});

export const Package = sequelize.define('package', {
    name: { type: Sequelize.STRING },
    icon: { type: Sequelize.STRING },
    category: { type: Sequelize.STRING },
    description: { type: Sequelize.STRING },
    version: { type: Sequelize.STRING },
});

Application.User = Application.belongsTo(User);
User.Applications = User.hasMany(Application);
Application.Package = Application.belongsTo(Package);
Package.Applications = Package.hasMany(Application);

User.sync();
Application.sync();
Package.sync();
