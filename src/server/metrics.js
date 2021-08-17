import 'babel-polyfill';
import express from 'express';
import Prometheus from 'prom-client';
import { PrismaClient } from '@prisma/client';
import { IpFilter, IpDeniedError } from 'express-ipfilter';
import { STATES } from './utils';

const prisma = new PrismaClient();

const gauge1 = new Prometheus.Gauge({
    name: 'ethibox_success',
    help: 'Displays whether or not domain was a success',
    labelNames: ['domain'],
});

const gauge2 = new Prometheus.Gauge({
    name: 'ethibox_response_time',
    help: 'Displays domain response time',
    labelNames: ['domain'],
});

const fetchDomains = async () => {
    const applications = await prisma.application.findMany({ where: { NOT: { state: STATES.DELETED } } });
    applications.forEach((app) => {
        const { domain, responseTime, state } = app;
        gauge1.set({ domain }, state === STATES.ONLINE ? 0 : 1);
        gauge2.set({ domain }, responseTime);
    });
};

const app = express();

const clientIp = (req) => {
    const ip = req.headers['x-forwarded-for'] ? (req.headers['x-forwarded-for']).split(',')[0] : req.socket.remoteAddress;
    return ip.replace('::ffff:', '');
};

const ips = ['172.17.0.0/16', '10.10.0.0/16', '127.0.0.1', '::1'];
app.use(IpFilter(ips, { mode: 'allow', logLevel: 'deny', detectIp: clientIp }));

app.use((err, req, res, next) => {
    if (err instanceof IpDeniedError) {
        res.status(401);
        return res.end('You shall not pass');
    }

    return next();
});

app.get('/', async (req, res) => {
    Prometheus.register.resetMetrics();

    await fetchDomains();

    res.set('Content-Type', Prometheus.register.contentType);
    res.end(Prometheus.register.metrics());
});

export default app;
