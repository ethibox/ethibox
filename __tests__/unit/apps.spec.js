import puppeteer from 'puppeteer';
import { resetDatabase, initDatabase, App, User } from '@lib/orm';
import { createStripeCheckoutSession, getCustomerSubscriptions } from '@lib/stripe';
import { mockApi } from '@lib/utils';
import * as utils from '@lib/utils';
import appsEndpoint from '@api/apps';

describe('Given the apps API', () => {
    let user;

    beforeAll(async () => {
        await resetDatabase();
        user = await initDatabase();
    });

    describe('When a call to /api/apps is made with a GET method', () => {
        it('Should return a list of apps', async () => {
            const req = { method: 'GET', body: { name: 'wordpress' } };

            const res = await appsEndpoint(req, mockApi(user), user);

            const { apps } = res;
            expect(apps[0].name).toBe('Wordpress');
            expect(apps[0].releaseName).toBe('wordpress1');
            expect(apps[0].logo).toBeDefined();
            expect(apps[0].category).toBeDefined();
            expect(apps[0].domain).toBeDefined();
            expect(res.status).toBe(200);
        });
    });

    describe('When a call to /api/apps is made with a POST method', () => {
        it('Should create an app', async () => {
            const session = await createStripeCheckoutSession({ name: 'wordpress' }, user);
            const req = { method: 'POST', body: { sessionId: session.id } };

            await appsEndpoint(req, mockApi(user), user);

            const app = await App.findOne({ where: { releaseName: 'wordpress2' }, raw: false });
            expect(app.state).toBe('standby');
        }, 10000);

        it('Should create an app with ADMIN_EMAIL and ADMIN_PASSWORD envs', async () => {
            const session = await createStripeCheckoutSession({ name: 'fathom' }, user);
            const req = { method: 'POST', body: { sessionId: session.id } };

            await appsEndpoint(req, mockApi(user), user);

            const app = await App.findOne({ where: { releaseName: 'fathom1' }, raw: false });
            const envs = await app.getEnvs();

            expect(envs).toEqual(expect.arrayContaining([
                expect.objectContaining({ name: 'ADMIN_EMAIL' }),
                expect.objectContaining({ value: user.email }),
                expect.objectContaining({ name: 'ADMIN_PASSWORD' }),
                expect.objectContaining({ value: expect.any(String) }),
            ]));
        });

        it('Should add releaseName metadata to the stripe subscription', async () => {
            const session = await createStripeCheckoutSession({ name: 'ghost' }, user, 'https://ethibox.fr');
            const req = { method: 'POST', body: { sessionId: session.id } };

            const browser = await puppeteer.launch({ headless: 'new' });
            const page = await browser.newPage();
            await page.goto(session.url);
            await page.waitForSelector('.SubmitButton');

            if (await page.evaluate(() => !!document.querySelector('#cardNumber'))) {
                await page.type('#cardNumber', '4242 4242 4242 4242');
                await page.type('#cardExpiry', '0424');
                await page.type('#cardCvc', '123');
                await page.type('#billingName', 'John Doe');
            }

            if (await page.evaluate(() => !!document.querySelector('#billingPostalCode'))) {
                await page.type('#billingPostalCode', '12345');
            }

            await page.click('.SubmitButton');
            await page.waitForNavigation();
            await browser.close();

            await appsEndpoint(req, mockApi(user), user);

            const subscriptions = await getCustomerSubscriptions(user.id);
            const subscription = subscriptions.find((s) => s.metadata.releaseName === 'ghost1');
            expect(subscription).toBeDefined();
        }, 30000);

        it('Should not duplicate apps with a same stripe session id', async () => {
            const session = await createStripeCheckoutSession({ name: 'taiga' }, user);
            const req = { method: 'POST', body: { sessionId: session.id } };

            await appsEndpoint(req, mockApi(user), user);
            const res = await appsEndpoint(req, mockApi(user), user);

            expect(res).toEqual(expect.objectContaining({
                message: 'App already exist',
                status: 400,
            }));
        });

        it.skip('Should update customer name', async () => {
            const session = await createStripeCheckoutSession({ name: 'wordpress' }, { ...user, firstName: 'John', lastName: 'Doe' });
            const req = { method: 'POST', body: { sessionId: session.id } };

            await appsEndpoint(req, mockApi(user), user);

            const updatedUser = await User.findOne({ where: { id: user.id } });
            expect(updatedUser.firstName).toBe('John');
            expect(updatedUser.lastName).toBe('Doe');
        });

        it('Should send webhook with a global env', async () => {
            process.env.CUSTOM_ENV_ALL_VOLUME_PATH = '/mnt/data/';
            const session = await createStripeCheckoutSession({ name: 'wordpress' }, user);
            const req = { method: 'POST', body: { sessionId: session.id } };
            const sendWebhook = jest.spyOn(utils, 'sendWebhook').mockImplementation(async () => {});

            await appsEndpoint(req, mockApi(user), user);

            expect(sendWebhook).toHaveBeenCalledWith(
                expect.objectContaining({
                    envs: expect.stringContaining('VOLUME_PATH'),
                }),
            );

            expect(sendWebhook).toHaveBeenCalledWith(
                expect.objectContaining({
                    envs: expect.stringContaining('/mnt/data/'),
                }),
            );
        });

        it('Should send webhook with a custom app env', async () => {
            process.env.CUSTOM_ENV_INVOICE_NINJA_APP_KEY = 'appkey';
            const session = await createStripeCheckoutSession({ name: 'invoice-ninja' }, user);
            const req = { method: 'POST', body: { sessionId: session.id } };
            const sendWebhook = jest.spyOn(utils, 'sendWebhook').mockImplementation(async () => {});

            await appsEndpoint(req, mockApi(user), user);

            expect(sendWebhook).toHaveBeenCalledWith(
                expect.objectContaining({
                    envs: expect.stringContaining('APP_KEY'),
                }),
            );

            expect(sendWebhook).toHaveBeenCalledWith(
                expect.objectContaining({
                    envs: expect.stringContaining('appkey'),
                }),
            );
        });
    });

    describe('When a call to /api/apps is made with a PUT method', () => {
        it('Should update the app', async () => {
            const req = {
                method: 'PUT',
                body: {
                    releaseName: 'peertube1',
                    envs: [
                        { name: 'SMTP_HOSTNAME', value: 'smtp.ethibox.fr' },
                        { name: 'SMTP_PORT', value: '587' },
                    ],
                },
            };

            await appsEndpoint(req, mockApi(user), user);

            const app = await App.findOne({ where: { releaseName: req.body.releaseName }, include: { all: true, nested: true }, raw: false });
            expect(app.envs.find((e) => e.name === 'SMTP_HOSTNAME').value).toBe(req.body.envs[0].value);
            expect(app.envs.find((e) => e.name === 'SMTP_PORT').value).toBe(req.body.envs[1].value);
        });

        it('Should not update the app if the domain is already taken', async () => {
            const req = { method: 'PUT', body: { releaseName: 'peertube1', domain: 'wordpress1.localhost' } };

            const res = await appsEndpoint(req, mockApi(user), user);

            expect(res.message).toBe('Domain already exist');
            expect(res.status).toBe(400);
        });

        it('Should not update the app if the domain is not allowed', async () => {
            const req = { method: 'PUT', body: { releaseName: 'peertube1', domain: 'peertube2.localhost' } };

            const res = await appsEndpoint(req, mockApi(user), user);

            expect(res.message).toBe('You are not authorized to use this domain');
            expect(res.status).toBe(400);
        });

        it('Should not update the app if the domain is not valid', async () => {
            const req = { method: 'PUT', body: { releaseName: 'peertube1', domain: 'bad.domain' } };

            const res = await appsEndpoint(req, mockApi(user), user);

            expect(res.message).toMatch(/Please setup a correct DNS zone/);
            expect(res.status).toBe(400);
        });

        it('Should not update the app if the envs are not valid', async () => {
            const req = {
                method: 'PUT',
                body: {
                    releaseName: 'peertube1',
                    envs: [
                        { name: 'UNEXISTING_ENV', value: 'unexisting' },
                    ],
                },
            };
            const res = await appsEndpoint(req, mockApi(user), user);

            expect(res.message).toBe('Envs are not valid');
            expect(res.status).toBe(400);
        });

        it('Should send webhook with a global env', async () => {
            process.env.CUSTOM_ENV_ALL_VOLUME_PATH = '/mnt/data/';
            const req = { method: 'PUT', body: { releaseName: 'peertube1', envs: [{ name: 'SMTP_PORT', value: '465' }] } };
            const sendWebhook = jest.spyOn(utils, 'sendWebhook').mockImplementation(async () => {});

            await appsEndpoint(req, mockApi(user), user);

            expect(sendWebhook).toHaveBeenCalledWith(
                expect.objectContaining({
                    envs: expect.stringContaining('VOLUME_PATH'),
                }),
            );

            expect(sendWebhook).toHaveBeenCalledWith(
                expect.objectContaining({
                    envs: expect.stringContaining('/mnt/data/'),
                }),
            );
        });

        it('Should send webhook with envs from the database', async () => {
            const req = { method: 'PUT', body: { releaseName: 'peertube1', envs: [{ name: 'SMTP_PORT', value: '465' }] } };
            const app = await App.findOne({ where: { releaseName: 'peertube1' }, raw: false });
            await app.createEnv({ name: 'POSTGRES_PASSWORD', value: 'cust0mp@ssword' });
            const sendWebhook = jest.spyOn(utils, 'sendWebhook').mockImplementation(async () => {});

            await appsEndpoint(req, mockApi(user), user);

            expect(sendWebhook).toHaveBeenCalledWith(
                expect.objectContaining({
                    envs: expect.stringContaining('POSTGRES_PASSWORD'),
                }),
            );

            expect(sendWebhook).toHaveBeenCalledWith(
                expect.objectContaining({
                    envs: expect.stringContaining('cust0mp@ssword'),
                }),
            );
        });
    });

    describe('When a call to /api/apps is made with a DELETE method', () => {
        it('Should delete an app', async () => {
            const req = { method: 'DELETE', body: { releaseName: 'wordpress1' } };

            const res = await appsEndpoint(req, mockApi(user), user);

            const app = await App.findOne({ where: { releaseName: req.body.releaseName } });
            expect(app.state).toBe('deleted');
            expect(res.status).toBe(200);
        });

        it('Should delete stripe subscription', async () => {
            const req = { method: 'DELETE', body: { releaseName: 'ghost1' } };

            await appsEndpoint(req, mockApi(user), user);

            const subscriptions = await getCustomerSubscriptions(user.id);
            const subscription = subscriptions.find((s) => s.metadata.releaseName === 'ghost1');
            expect(subscription).toBeUndefined();
        });
    });
});
