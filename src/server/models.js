import Sequelize from 'sequelize';

const DB_PATH = '/tmp/db.sqlite';

const db = `sqlite://${DB_PATH}`;
const sequelize = new Sequelize(db);

export const User = sequelize.define('user', {
    ip: { type: Sequelize.STRING, validate: { isIP: true } },
    email: { type: Sequelize.STRING, validate: { isEmail: true } },
    password: { type: Sequelize.STRING },
});

User.sync();
