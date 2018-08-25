import 'isomorphic-fetch';
import { Application, Settings } from './models';
import { getSettings, checkUrl, checkOrchestratorConnection, ACTIONS, STATES } from './utils';
import { synchronizeEthibox, synchronizeOrchestrator } from './connector';

export const trackStuckActions = async () => {
    const secondsToWaitAction = process.env.NODE_ENV === 'production' ? 15 : 5;
    const currentTime = new Date().getTime();
    const apps = await Application.findAll({ where: { action: [ACTIONS.INSTALL, ACTIONS.UNINSTALL, ACTIONS.EDIT] } });

    apps.forEach((app) => {
        const lastModified = new Date(app.updatedAt).getTime();

        if (currentTime - lastModified > (secondsToWaitAction * 1000)) {
            // app.update({ error: 'Application stuck' });
        }
    });
};

export const trackInstallingApps = async (orchestratorIp) => {
    const apps = await Application.findAll({ where: { state: [STATES.INSTALLING] } }, { raw: true });

    apps.forEach(async (app) => {
        const entrypoint = `http://${orchestratorIp}:${app.port}`;
        if (await checkUrl(entrypoint)) {
            app.update({ state: STATES.RUNNING }, { where: { id: app.id } });
        }
    });
};

setInterval(async () => {
    const { orchestratorEndpoint, orchestratorToken, orchestratorIp, disableOrchestratorSync } = await getSettings();

    if (!disableOrchestratorSync && orchestratorToken && orchestratorToken) {
        const isOrchestratorOnline = await checkOrchestratorConnection(orchestratorEndpoint, orchestratorToken);
        await Settings.update({ value: isOrchestratorOnline }, { where: { name: 'isOrchestratorOnline' } });

        if (isOrchestratorOnline) {
            await synchronizeOrchestrator();
            await synchronizeEthibox();
            await trackInstallingApps(orchestratorIp);
        }
    }

    await trackStuckActions();
}, 10000);
