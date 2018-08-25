import { exec } from 'shelljs';
import { STATES, ACTIONS } from './utils';
import { sequelize, User, Application, Package } from './models';

export const initOrchestrator = (endpoint, token) => {
    exec(`kubectl config set-cluster kubernetes --insecure-skip-tls-verify=true --server=${endpoint}`);
    exec('kubectl config set-context kubernetes --cluster=kubernetes --user=kubernetes-admin --namespace=default');
    exec(`kubectl config set-credentials kubernetes --token=${token}`);
    exec('kubectl config use-context kubernetes');
    exec('helm init');
};

export const installApplication = async (releaseName, stackFileUrl) => {
    exec(`helm install --name ${releaseName} ${stackFileUrl}`, { silent: true });
};

export const uninstallApplication = (releaseName) => {
    exec(`helm delete --purge ${releaseName}`, { silent: true });
};

export const editApplication = async (releaseName, domainName, stackFileUrl) => {
    if (domainName) {
        exec(`helm upgrade --install ${releaseName} --set ingress.enabled=${!!domainName},ingress.hosts[0]=${domainName} --reuse-values ${stackFileUrl}`, { silent: true });
    } else {
        exec(`helm upgrade --install ${releaseName} --set ingress.enabled=false --reuse-values ${stackFileUrl}`, { silent: true });
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

export const synchronizeOrchestrator = async () => {
    const applications = await sequelize.query(`SELECT releaseName, domainName, state, port, error, name, category, userId, action, stackFileUrl
       FROM applications
       LEFT JOIN packages AS package ON applications.packageId = package.id
       INNER JOIN users AS user ON applications.userId = user.id`, { type: sequelize.QueryTypes.SELECT });

    applications.forEach(async (application) => {
        const { action, releaseName, stackFileUrl, domainName, userId } = application;
        const helmReleaseName = `${releaseName}-${userId}`;

        switch (action) {
            case ACTIONS.INSTALL:
                await installApplication(helmReleaseName, stackFileUrl);
                await Application.update({ action: null }, { where: { releaseName } });
                break;
            case ACTIONS.UNINSTALL:
                await uninstallApplication(helmReleaseName);
                await Application.update({ action: null }, { where: { releaseName } });
                break;
            case ACTIONS.EDIT:
                await editApplication(helmReleaseName, domainName, stackFileUrl);
                await Application.update({ action: null }, { where: { releaseName } });
                break;
            default:
                break;
        }
    });
};

export const synchronizeEthibox = async () => {
    const orchestratorApps = await listOrchestratorApps();

    orchestratorApps.forEach(async (app) => {
        const { name, releaseName, userId } = app;
        if (!await Application.findOne({ where: { releaseName, userId }, raw: true })) {
            const pkg = await Package.findOne({ where: { name } });
            const user = await User.findOne({ where: { id: userId } });

            if (user && pkg) {
                const application = Application.build({ ...app, state: STATES.INSTALLING });
                application.setPackage(pkg, { save: false });
                application.setUser(user, { save: false });
                application.save();
            }
        } else {
            Application.update(app, { where: { releaseName } });
        }
    });

    const orchestratorAppsName = orchestratorApps.map(app => (app.releaseName));
    const ethiboxApps = await Application.findAll({ raw: true });
    const ethiboxAppsName = ethiboxApps.map(app => (app.releaseName));
    const deletedOrchestratorApps = ethiboxAppsName.filter(name => !orchestratorAppsName.includes(name));

    if (deletedOrchestratorApps) {
        Application.destroy({ where: { releaseName: [...deletedOrchestratorApps] } });
    }
};
