import { App } from '../../lib/orm';
import { STATE } from '../../lib/constants';

export default async (req, res) => {
    const offlineApps = await App.count({ where: { state: STATE.OFFLINE } });

    if (offlineApps > 0) {
        return res.status(503).json({ status: 'error', message: `${offlineApps} app(s) down` });
    }

    return res.status(200).json({ status: 'ok' });
};
