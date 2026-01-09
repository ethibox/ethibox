import ipRangeCheck from 'ip-range-check';
import { register, Gauge } from 'prom-client';
import { Op, App } from '../../lib/orm';
import { STATE } from '../../lib/constants';

register.clear();
const gauge = new Gauge({ name: 'metric_name', help: 'metric_help' });

const gauge1 = new Gauge({
    name: 'ethibox_success',
    help: 'Displays whether or not domain was a success',
    labelNames: ['domain'],
});

const gauge2 = new Gauge({
    name: 'ethibox_response_time',
    help: 'Displays domain response time',
    labelNames: ['domain'],
});

const isAuthorized = (ip) => {
    const authorizedIps = ['127.0.0.1', '::1', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];
    return authorizedIps.some((range) => ipRangeCheck(ip, range));
};

export default async (req, res) => {
    register.resetMetrics();

    const ip = req.connection.remoteAddress.replace('::ffff:', '');

    if (!isAuthorized(ip)) {
        return res.status(401).send({ success: false, message: 'You are not authorized' });
    }

    gauge.set(10);

    const apps = await App.findAll({ where: { [Op.not]: { state: STATE.DELETED } } });

    for (const { domain, state, responseTime = 0 } of apps) {
        gauge1.set({ domain }, [STATE.ONLINE, STATE.WAITING].includes(state) ? 1 : 0);
        gauge2.set({ domain }, responseTime);
    }

    res.setHeader('Content-type', register.contentType);
    return res.send(await register.metrics());
};
