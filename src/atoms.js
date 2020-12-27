import { selector, selectorFamily, atom } from 'recoil';
import { withPrefix } from 'gatsby';

import { getToken, checkStatus } from './utils';

const loadStripe = async () => fetch(withPrefix('/graphql'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-access-token': getToken() },
    body: JSON.stringify({ query: `{
        stripe { stripeEnabled, stripePublishableKey, stripeClientSecret, stripeLast4 }
    }` }),
})
    .then(checkStatus)
    .then(({ data }) => data.stripe)
    .catch(({ message }) => {
        throw new Error(message);
    });

const loadUser = async () => fetch(withPrefix('/graphql'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-access-token': getToken() },
    body: JSON.stringify({ query: `{
        user { firstName, lastName, email, isAdmin }
    }` }),
})
    .then(checkStatus)
    .then(({ data }) => data.user)
    .catch(({ message }) => {
        throw new Error(message);
    });

const loadTemplates = async () => fetch(withPrefix('/graphql'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-access-token': getToken() },
    body: JSON.stringify({ query: `{
        templates { id, name, category, logo, description, price, trial, screenshots, website }
    }` }),
})
    .then(checkStatus)
    .then(({ data }) => data.templates)
    .catch(({ message }) => {
        throw new Error(message);
    });

const loadInvoices = async () => fetch(withPrefix('/graphql'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-access-token': getToken() },
    body: JSON.stringify({ query: `{
        invoices { url, status, date, total }
    }` }),
})
    .then(checkStatus)
    .then(({ data }) => data.invoices)
    .catch(({ message }) => {
        throw new Error(message);
    });

const loadApplications = async () => fetch(withPrefix('/graphql'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-access-token': getToken() },
    body: JSON.stringify({ query: `{
        applications { name, releaseName, description, price, category, logo, task, state, error, domain, adminPath, lastTaskDate }
    }` }),
})
    .then(checkStatus)
    .then(({ data }) => data.applications)
    .catch(({ message }) => {
        throw new Error(message);
    });

const loadAdminSettings = async () => fetch(withPrefix('/graphql'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-access-token': getToken() },
    body: JSON.stringify({ query: `{
        settings { id, name, value }
        globalEnvs { id, name, value }
        webhooks { id, event, targetUrl }
    }` }),
})
    .then(checkStatus)
    .then(({ data }) => data)
    .catch(({ message }) => {
        throw new Error(message);
    });

const loadApplicationEnvs = async (releaseName) => fetch(withPrefix('/graphql'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-access-token': getToken() },
    body: JSON.stringify({ query: `{
        applicationEnvs(releaseName: "${releaseName}") { name, value, label, disabled, type, select { text, value } }
    }` }),
})
    .then(checkStatus)
    .then(({ data }) => data.applicationEnvs)
    .catch(({ message }) => {
        throw new Error(message);
    });

export const applicationEnvsSelector = selectorFamily({
    key: 'applicationEnvsSelector',
    get: (releaseName) => async () => {
        const applicationEnvs = await loadApplicationEnvs(releaseName);
        return applicationEnvs;
    },
});

export const adminSettingsSelector = selector({
    key: 'adminSettingsSelector',
    get: loadAdminSettings,
});

export const adminSettingsState = atom({
    key: 'adminSettingsState',
    default: adminSettingsSelector,
});

export const userStateSelector = selector({
    key: 'userStateSelector',
    get: loadUser,
});

export const userState = atom({
    key: 'userState',
    default: userStateSelector,
});

export const templatesSelector = selector({
    key: 'templatesSelector',
    get: async () => {
        const templates = await loadTemplates();
        return templates.sort((a, b) => a.name.localeCompare(b.name));
    },
});

export const templatesState = atom({
    key: 'templatesState',
    default: templatesSelector,
});

export const invoicesSelector = selector({
    key: 'invoicesSelector',
    get: async () => {
        const invoices = await loadInvoices();
        return invoices;
    },
});

export const invoicesState = atom({
    key: 'invoicesState',
    default: invoicesSelector,
});

export const applicationsSelector = selector({
    key: 'applicationsSelector',
    get: async () => {
        const applications = await loadApplications();
        return applications.sort((a, b) => a.name.localeCompare(b.name));
    },
});

export const applicationsState = atom({
    key: 'applicationsState',
    default: applicationsSelector,
});

export const stripeSelector = selector({
    key: 'stripeSelector',
    get: loadStripe,
});

export const stripeState = atom({
    key: 'stripeState',
    default: stripeSelector,
});
