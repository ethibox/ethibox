import { exec } from 'shelljs';
import https from 'https';
import { Op } from 'sequelize';
import { timeout, STATES, ACTIONS } from './utils';
import { User, Application, Package } from './models';

export const initOrchestrator = (endpoint, token) => {
    exec(`kubectl config set-cluster kubernetes --insecure-skip-tls-verify=true --server=${endpoint}`, { silent: true });
    exec('kubectl config set-context kubernetes --cluster=kubernetes --user=kubernetes --namespace=default', { silent: true });
    exec(`kubectl config set-credentials kubernetes --token=${token}`, { silent: true });
    exec('kubectl config use-context kubernetes', { silent: true });
    exec('helm init', { silent: true });
};

export const checkOrchestratorConnection = async (endpoint, token) => {
    try {
        const agent = new https.Agent({ rejectUnauthorized: false });
        const { status } = await timeout(10000, fetch(`${endpoint}/healthz`, { headers: { Authorization: `Bearer ${token}` }, agent }));
        return (status === 200);
    } catch (e) {
        return false;
    }
};

export const installApplication = async (releaseName, stackFileUrl) => {
    exec(`helm install --name ${releaseName} --set service.type=NodePort,persistence.enabled=true ${stackFileUrl}`, { silent: true });
};

export const uninstallApplication = (releaseName) => {
    exec(`helm delete --purge ${releaseName}`, { silent: true });
};

export const editApplication = async (releaseName, domainName, stackFileUrl) => {
    if (domainName) {
        exec(`helm upgrade ${releaseName} --set ingress.enabled=true,ingress.hosts[0]=${domainName} --reuse-values ${stackFileUrl}`, { silent: true });
    } else {
        exec(`helm upgrade ${releaseName} --set ingress.enabled=false --reuse-values ${stackFileUrl}`, { silent: true });
    }
};

export const listOrchestratorApps = async (namespace = 'default') => {
    const services = JSON.parse(exec(`kubectl get svc -n ${namespace} -o json -l heritage=Tiller`, { silent: true }).stdout);

    let apps = services.items.map(svc => ({
        name: svc.metadata.labels.app,
        releaseName: svc.metadata.labels.release,
        port: svc.spec.ports[0].nodePort || null,
        domainName: svc.metadata.labels.domain || null,
    }));

    apps = apps.map((app) => {
        app.userId = (app.releaseName.match(/[0-9]+$/)) ? Number(app.releaseName.match(/[0-9]+$/)[0]) : null;
        app.releaseName = app.releaseName.replace(/-[0-9]+$/, '');
        return app;
    });

    apps = apps.filter(app => app.userId && app.port);

    return apps;
};

export const synchronizeOrchestrator = async (ethiboxApps) => {
    await Promise.all(ethiboxApps.map(async (app) => {
        const { action, releaseName, domainName, userId } = app;
        const { stackFileUrl } = app.package;
        const helmReleaseName = `${releaseName}-${userId}`;

        switch (action) {
            case ACTIONS.INSTALL:
                await installApplication(helmReleaseName, stackFileUrl);
                await app.update({ action: null });
                break;
            case ACTIONS.UNINSTALL:
                await uninstallApplication(helmReleaseName);
                await app.update({ action: null });
                break;
            case ACTIONS.EDIT:
                await editApplication(helmReleaseName, domainName, stackFileUrl);
                await app.update({ action: null });
                break;
            default:
                break;
        }
    }));
};

export const synchronizeEthibox = async (orchestratorApps) => {
    await Promise.all(orchestratorApps.map(async (app) => {
        const { name, releaseName, userId } = app;
        const ethiboxApp = await Application.findOne({ where: { releaseName, userId } });
        if (!ethiboxApp) {
            const pkg = await Package.findOne({ where: { name } });
            const user = await User.findOne({ where: { id: userId } });

            const application = Application.build({ ...app, state: STATES.INSTALLING });
            application.setPackage(pkg, { save: false });
            application.setUser(user, { save: false });
            application.save();
        } else {
            await ethiboxApp.update(app);
        }
    }));

    const orchestratorAppsName = orchestratorApps.map(app => (app.releaseName));
    const ethiboxApps = await Application.findAll({ where: { [Op.not]: { state: STATES.INSTALLING } }, raw: true });
    const ethiboxAppsName = ethiboxApps.map(app => (app.releaseName));
    const deletedOrchestratorApps = ethiboxAppsName.filter(name => !orchestratorAppsName.includes(name));

    if (deletedOrchestratorApps) {
        Application.destroy({ where: { releaseName: [...deletedOrchestratorApps] } });
    }
};
