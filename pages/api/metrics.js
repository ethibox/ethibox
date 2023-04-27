import ipRangeCheck from 'ip-range-check';
import { register, Gauge } from 'prom-client';
import { Op, App } from '@lib/orm';

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

export default async (req, res) => {
    const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress).replace('::ffff:', '');
    const authorizedIps = ['172.17.0.0/16', '10.0.0.0/16', '10.10.0.0/16', '127.0.0.1', '::1'];

    const isAuthorized = authorizedIps.some((range) => ipRangeCheck(ip, range));

    if (!isAuthorized) {
        return res.status(401).send({ success: false, message: 'You are not authorized' });
    }

    gauge.set(10);

    const applications = await App.findAll({ where: { [Op.not]: { state: 'deleted' } } });

    for (const { domain, state, responseTime = 0 } of applications) {
        gauge1.set({ domain }, state === 'online' ? 1 : 0);
        gauge2.set({ domain }, responseTime);
    }

    res.setHeader('Content-type', register.contentType);
    return res.send(await register.metrics());
};
