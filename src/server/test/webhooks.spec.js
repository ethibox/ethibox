import 'babel-polyfill';
import fs from 'fs';
import express from 'express';
import bodyParser from 'body-parser';
import { PrismaClient } from '@prisma/client';
import { templates } from './templates.json';
import { reset, importTemplates, addUser, addApps, addWebhooks } from './fixture';
import { registerMutation, installApplicationMutation, updateApplicationMutation, uninstallApplicationMutation } from '../resolvers';
import { EVENTS } from '../utils';

const PORT = process.env.PORT || 9999;
const REQUEST_TMP_FILE = process.env.REQUEST_TMP_FILE || '/tmp/request.json';

const prisma = new PrismaClient();

const app = express();
app.use(bodyParser.json());

app.post('/', (req, res) => {
    fs.writeFileSync(REQUEST_TMP_FILE, JSON.stringify(req.body));
    res.status(200).json(req.body);
});

app.listen(PORT);

test('Should send webhook during registration', async () => {
    await reset(prisma);
    await addWebhooks([{ event: EVENTS.REGISTER, targetUrl: `http://localhost:${PORT}/` }], prisma);

    const data = { email: 'user@example.com', password: 'myp@ssw0rd' };

    await registerMutation(null, data, { prisma });

    const request = JSON.parse(fs.readFileSync(REQUEST_TMP_FILE));

    expect(request.email).toBe(data.email);
    expect(request.token).toMatch(/[a-zA-Z0-9]+/);
});

test('Should send webhook during application installation', async () => {
    await reset(prisma);
    await importTemplates(prisma);

    await addWebhooks([{ event: EVENTS.INSTALL, targetUrl: `http://localhost:${PORT}/` }], prisma);

    const user = await addUser({ email: 'user@example.com', password: 'myp@ssw0rd', isAdmin: false }, prisma);

    const template = await prisma.template.findUnique({ where: { name: 'Invoice-ninja' } });

    await installApplicationMutation(null, { templateId: template.id }, { user, prisma });

    const request = JSON.parse(fs.readFileSync(REQUEST_TMP_FILE));

    const envs = templates.find((t) => t.title === 'Invoice-ninja').env
        .map(({ name, value, type, select }) => ({ name, value: type === 'select' ? select[0].value : value }))
        .map(({ name, value }) => ({ name, value: value === undefined ? null : value }))
        .concat([{ name: 'DOMAIN', value: 'invoice-ninja1.localhost' }, { name: 'NUMBER', value: '1' }]);

    expect(request.releaseName).toBe('invoice-ninja1');
    expect(request.envs).toBe(JSON.stringify(envs));
    expect(request.user.email).toBe('user@example.com');
});

test('Should send webhook during application updating', async () => {
    await reset(prisma);
    await importTemplates(prisma);

    const user = await addUser({ email: 'user@example.com', password: 'myp@ssw0rd', isAdmin: false }, prisma);
    await addApps([{ templateId: 3, userId: user.id }], prisma);
    await addWebhooks([{ event: EVENTS.UPDATE, targetUrl: `http://localhost:${PORT}/` }], prisma);

    const { releaseName, domain } = await prisma.application.findUnique({ where: { id: 1 } });

    const newEnvs = [{ name: 'SMTP_PORT', value: '25' }];

    await updateApplicationMutation(null, {
        releaseName,
        envs: newEnvs,
        domain,
    }, { user, prisma });

    const request = JSON.parse(fs.readFileSync(REQUEST_TMP_FILE));

    let envs = templates.find((t) => t.title === 'Invoice-ninja').env
        .map(({ name, value, type, select }) => ({ name, value: type === 'select' ? select[0].value : value }))
        .map(({ name, value }) => ({ name, value: value === undefined ? null : value }))
        .concat([...newEnvs, { name: 'DOMAIN', value: 'invoice-ninja1.localhost' }, { name: 'NUMBER', value: '1' }]);

    envs = [...new Map(envs.map((item) => [item.name, item])).values()];

    expect(request.releaseName).toBe('invoice-ninja1');
    expect(request.envs).toBe(JSON.stringify(envs));
});

test('Should send webhook during application uninstalling', async () => {
    await reset(prisma);
    await importTemplates(prisma);

    const user = await addUser({ email: 'user@example.com', password: 'myp@ssw0rd', isAdmin: false }, prisma);

    await addApps([{ templateId: 3, userId: user.id }], prisma);
    await addWebhooks([{ event: EVENTS.UNINSTALL, targetUrl: `http://localhost:${PORT}/` }], prisma);

    const { releaseName } = await prisma.application.findUnique({ where: { id: 1 } });

    const ctx = { user, prisma };
    expect(await uninstallApplicationMutation(null, { releaseName }, ctx)).toEqual(true);

    const request = JSON.parse(fs.readFileSync(REQUEST_TMP_FILE));

    expect(request.application.releaseName).toBe('invoice-ninja1');
    expect(request.user.email).toBe('user@example.com');
});
