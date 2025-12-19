import { sequelize } from '../../lib/orm';

export default async (req, res) => {
    try {
        await sequelize.authenticate();
        res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error('Health check failed:', error); // eslint-disable-line no-console
        res.status(503).json({ status: 'error', message: error.message });
    }
};
