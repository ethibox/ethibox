import 'isomorphic-fetch';
import { Package, Application, Settings } from './models';
import { getSettings, checkUrl, checkDnsRecord, ACTIONS, STATES } from './utils';
import { checkOrchestratorConnection, synchronizeEthibox, synchronizeOrchestrator, listOrchestratorApps } from './connector';

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

export const trackCompletedActions = async (orchestratorIp) => {
    const ethiboxApps = await Application.findAll({ include: [{ model: Package }] });
    const { checkDnsEnabled } = await getSettings();
    await Promise.all(ethiboxApps.map(async (app) => {
        const { domainName, port } = app;
        const entrypoint = `http://${orchestratorIp}:${port}`;
        switch (app.state) {
            case STATES.INSTALLING:
                if (await checkUrl(entrypoint)) {
                    await app.update({ state: STATES.RUNNING });
                }
                break;
            case STATES.EDITING: {
                if (checkDnsEnabled && domainName) {
                    if (await checkDnsRecord(domainName, orchestratorIp)) {
                        await app.update({ state: STATES.RUNNING });
                    }
                } else if (await checkUrl(entrypoint)) {
                    await app.update({ state: STATES.RUNNING });
                }
                break;
            }
            default:
                break;
        }
    }));
};

setInterval(async () => {
    const { orchestratorEndpoint, orchestratorToken, orchestratorIp, disableOrchestratorSync } = await getSettings();

    if (!disableOrchestratorSync && orchestratorEndpoint && orchestratorToken) {
        const isOrchestratorOnline = await checkOrchestratorConnection(orchestratorEndpoint, orchestratorToken);
        await Settings.update({ value: isOrchestratorOnline }, { where: { name: 'isOrchestratorOnline' } });

        if (isOrchestratorOnline) {
            const ethiboxApps = await Application.findAll({ include: [{ model: Package }] });
            await synchronizeOrchestrator(ethiboxApps);

            const orchestratorApps = await listOrchestratorApps();
            await synchronizeEthibox(orchestratorApps);

            await trackCompletedActions(orchestratorIp);
        }
    }

    await trackStuckActions();
}, 10000);
