import { STATE } from '../../lib/constants';
import { getAppState } from '../../lib/cron';

test('Should return standby if a domain has an error from less than 3 minutes ago', async () => {
    const app = { domain: 'error.ethibox.fr', state: STATE.ONLINE, updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString() };

    const state = await getAppState(app);

    expect(state).toBe(STATE.STANDBY);
});

test('Should return offline if a domain has an error from more than 3 minutes ago', async () => {
    const app = { domain: 'error.ethibox.fr', state: STATE.STANDBY, updatedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString() };

    const state = await getAppState(app);

    expect(state).toBe(STATE.OFFLINE);
});

test('Should return online if a domain has no more error', async () => {
    const app = { domain: 'ethibox.fr', state: STATE.OFFLINE };

    const state = await getAppState(app);

    expect(state).toBe(STATE.ONLINE);
});
