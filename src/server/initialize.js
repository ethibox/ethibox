import { synchronizeStore, getSettings } from './utils';
import { Settings } from './models';

(async () => {
    const settings = [
        { name: 'orchestratorName' },
        { name: 'orchestratorEndpoint' },
        { name: 'orchestratorToken' },
        { name: 'orchestratorIp' },
        { name: 'isOrchestratorOnline', value: false },
        { name: 'stripeSecretKey' },
        { name: 'stripePublishableKey' },
        { name: 'stripePlanName' },
        { name: 'isMonetizationEnabled', value: false },
        { name: 'isDemoEnabled', value: false },
        { name: 'monthlyPrice', value: '$0' },
        { name: 'storeRepositoryUrl', value: 'https://charts.ethibox.fr/apps.json' },
    ];
    await Promise.all(settings.map(async ({ name, value }) => {
        if (!await Settings.findOne({ where: { name } })) {
            await Settings.create({ name, value });
        }
    }));

    const { storeRepositoryUrl } = await getSettings();
    await synchronizeStore(storeRepositoryUrl);
})();
