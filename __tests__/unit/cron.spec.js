import nock from 'nock';
import { sequelize, resetDatabase, App } from '@lib/orm';
import { checkAppsStatus } from '@lib/cron';

describe('Given the cron module', () => {
    beforeEach(async () => {
        await resetDatabase();
    });

    describe('When the checkAppsStatus function is called', () => {
        test('Should set standby state if a DNS record is not correct', async () => {
            await App.create({ releaseName: 'wordpress1', domain: 'bad.ethibox.fr', state: 'online' });

            await checkAppsStatus();

            const app = await App.findOne({ where: { domain: 'bad.ethibox.fr' } });
            expect(app.state).toBe('standby');
        });

        test('Should set standby state if an application has a certificate error', async () => {
            await App.create({ releaseName: 'wordpress1', domain: 'error.ethibox.fr', state: 'online' });

            await checkAppsStatus();

            const app = await App.findOne({ where: { domain: 'error.ethibox.fr' } });
            expect(app.state).toBe('standby');
        });

        test('Should set standby state if an application return a bad status code', async () => {
            await App.create({ releaseName: 'wordpress1', domain: 'wordpress1.localhost', state: 'online' });

            nock('http://wordpress1.localhost').get('/').reply(500);
            await checkAppsStatus();

            const app = await App.findOne({ where: { domain: 'wordpress1.localhost' } });
            expect(app.state).toBe('standby');
        });

        test('Should set online state if an application running again', async () => {
            await App.create({ releaseName: 'wordpress1', domain: 'wordpress1.localhost', state: 'standby' });

            nock('http://wordpress1.localhost').get('/').reply(200);
            await checkAppsStatus();

            const app = await App.findOne({ where: { domain: 'wordpress1.localhost' } });
            expect(app.state).toBe('online');
        });

        test('Should set offline state if an application is standby since more than 15 minutes', async () => {
            const MAX_TASK_TIME = 15;
            const updatedAt = new Date(new Date().setMinutes(new Date().getMinutes() - MAX_TASK_TIME)).toISOString();
            const { id } = await App.create({ releaseName: 'wordpress1', domain: 'wordpress1.localhost', state: 'standby', updatedAt });
            await sequelize.query('UPDATE apps SET updatedAt = :updatedAt WHERE id = :id', {
                replacements: { updatedAt, id },
            });

            nock('http://wordpress1.localhost').get('/').reply(500);
            await checkAppsStatus();

            const app = await App.findOne({ where: { domain: 'wordpress1.localhost' } });
            expect(app.state).toBe('offline');
        });

        test('Should set response time', async () => {
            await App.create({ releaseName: 'wordpress1', domain: 'wordpress1.localhost', state: 'online' });

            nock('http://wordpress1.localhost').get('/').delay(1000).reply(200);
            await checkAppsStatus();

            const app = await App.findOne({ where: { domain: 'wordpress1.localhost' } });
            expect(app.responseTime).toBeGreaterThanOrEqual(1000);
        });

        test('Should not change state if application is deleted', async () => {
            await App.create({ releaseName: 'wordpress1', domain: 'wordpress1.localhost', state: 'deleted' });

            await checkAppsStatus();

            const app = await App.findOne({ where: { domain: 'wordpress1.localhost' } });
            expect(app.state).toBe('deleted');
        });
    });
});
