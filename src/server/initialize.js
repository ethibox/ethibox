import fs from 'fs';
import { exec } from 'shelljs';
import { synchronizeStore, getSettings } from './utils';
import { Settings } from './models';
import { checkOrchestratorConnection, initOrchestrator } from './connector';

export const autoConfig = async () => {
    let orchestratorToken;
    let orchestratorEndpoint;
    let orchestratorIp;

    const tokenPath = `${process.env.TELEPRESENCE_ROOT || ''}/var/run/secrets/kubernetes.io/serviceaccount/token`;

    if (fs.existsSync(tokenPath)) {
        orchestratorToken = fs.readFileSync(tokenPath, 'utf8');
        orchestratorEndpoint = 'https://kubernetes.default';
    }

    if (await checkOrchestratorConnection(orchestratorEndpoint, orchestratorToken)) {
        await initOrchestrator(orchestratorEndpoint, orchestratorToken);
        orchestratorIp = exec('kubectl -n kube-system get pods -l component=kube-apiserver -o json | jq -r ".items[0].spec.containers[0].livenessProbe.httpGet.host"', { silent: true }).stdout.trim();
    }

    return { orchestratorToken, orchestratorEndpoint, orchestratorIp };
};

export const initializeSettings = async (defaultSettings = {}) => {
    const settings = [
        { name: 'orchestratorName', value: 'kubernetes' },
        { name: 'orchestratorEndpoint', value: (defaultSettings.orchestratorEndpoint || '') },
        { name: 'orchestratorToken', value: (defaultSettings.orchestratorToken || '') },
        { name: 'orchestratorIp', value: (defaultSettings.orchestratorIp || '') },
        { name: 'isOrchestratorOnline', value: (defaultSettings.isOrchestratorOnline || false) },
        { name: 'stripeSecretKey', value: (defaultSettings.stripeSecretKey || '') },
        { name: 'stripePublishableKey', value: (defaultSettings.stripePublishableKey || '') },
        { name: 'stripePlanName', value: (defaultSettings.stripePlanName || '') },
        { name: 'isMonetizationEnabled', value: (defaultSettings.isMonetizationEnabled || false) },
        { name: 'isDemoEnabled', value: (defaultSettings.isDemoEnabled || false) },
        { name: 'monthlyPrice', value: (defaultSettings.monthlyPrice || '$0') },
        { name: 'storeRepositoryUrl', value: (defaultSettings.storeRepositoryUrl || 'https://store.ethibox.io/apps.json') },
        { name: 'disableOrchestratorCheck', value: (defaultSettings.disableOrchestratorCheck || false) },
        { name: 'disableOrchestratorSync', value: (defaultSettings.disableOrchestratorSync || false) },
        { name: 'checkDnsEnabled', value: (defaultSettings.checkDnsEnabled || false) },
    ];

    await Promise.all(settings.map(async ({ name, value }) => {
        if (!await Settings.findOne({ where: { name } })) {
            await Settings.create({ name, value });
        }
    }));

    const newSettings = await getSettings();
    return newSettings;
};

(async () => {
    const config = await autoConfig();
    const { storeRepositoryUrl, orchestratorEndpoint, orchestratorToken } = await initializeSettings(config);
    await synchronizeStore(storeRepositoryUrl);

    if (await checkOrchestratorConnection(orchestratorEndpoint, orchestratorToken)) {
        await initOrchestrator(orchestratorEndpoint, orchestratorToken);
    }
})();
