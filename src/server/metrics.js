import 'babel-polyfill';
import express from 'express';
import Prometheus from 'prom-client';
import { PrismaClient } from '@prisma/client';
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
        const { domain, responseTime, error } = app;
        gauge1.set({ domain }, error ? 1 : 0);
        gauge2.set({ domain }, responseTime);
    });
};

const app = express();

app.get('/metrics', async (req, res) => {
    Prometheus.register.resetMetrics();

    await fetchDomains();

    res.set('Content-Type', Prometheus.register.contentType);
    res.end(Prometheus.register.metrics());
});

app.listen(9090);
