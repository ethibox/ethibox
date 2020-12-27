import 'babel-polyfill';
import 'isomorphic-fetch';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { checkStatus, isAuth } from './utils';

export const auth = async (endpoint, username, password) => {
    const { jwt } = await fetch(`${endpoint}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    })
        .then(checkStatus)
        .catch((message) => {
            console.error(message);
            throw new Error('Portainer request failed');
        });

    return jwt;
};

export const getPortainerConfig = async () => {
    const tokenPath = process.env.NODE_ENV === 'production' ? './.token' : path.join(__dirname, '../../.token');

    const config = {
        endpoint: process.env.PORTAINER_ENDPOINT || 'http://portainer.localhost',
        username: process.env.PORTAINER_USERNAME || 'admin',
        password: process.env.PORTAINER_PASSWORD || 'myp@ssw0rd',
        token: fs.existsSync(tokenPath) ? fs.readFileSync(tokenPath, 'utf8') : '',
    };

    if (!isAuth(config.token)) {
        config.token = await auth(config.endpoint, config.username, config.password);
        fs.writeFileSync(tokenPath, config.token);
    }

    return config;
};

export const portainerRequest = async (requestPath, method = 'GET', body = {}) => {
    const { endpoint, token } = await getPortainerConfig();

    const url = `${endpoint}${requestPath}`;

    const data = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    })
        .then(method !== 'DELETE' ? checkStatus : () => true)
        .catch(({ message }) => {
            console.error(message);
            throw new Error('Portainer request failed');
        });

    return data;
};

export const getEndpointId = async () => {
    const endpoints = await portainerRequest('/api/endpoints');

    return endpoints[0].Id;
};

export const getNodeSwarmId = async (endpointId = 1) => {
    const swarm = await portainerRequest(`/api/endpoints/${endpointId}/docker/swarm`)
        .catch((message) => {
            console.error(message);
            return { ID: null };
        });

    return swarm.ID;
};

export const fetchStacks = async () => {
    const endpointId = await getEndpointId();

    const stacks = await portainerRequest(`/api/stacks?method=repository&type=1&endpointId=${endpointId}`)
        .catch((message) => {
            console.error(message);
            return [];
        });

    return stacks;
};

export const installApplication = async (releaseName, domain, repositoryUrl, stackFile, envs = []) => {
    const endpointId = await getEndpointId();
    const SwarmId = await getNodeSwarmId(endpointId);

    const application = await portainerRequest(`/api/stacks?method=repository&type=1&endpointId=${endpointId}`, 'POST', {
        Name: releaseName,
        RepositoryURL: repositoryUrl,
        ComposeFilePathInRepository: stackFile,
        SwarmId,
        Env: envs,
    })
        .catch(({ message }) => {
            if (message === 'Conflict') {
                throw new Error('Application already exist');
            }
            console.error(message);
            throw new Error(message);
        });

    return application;
};

export const uninstallApplication = async (releaseName) => {
    const stacks = await fetchStacks();
    const stack = stacks.find((s) => s.Name === releaseName);

    if (!stack) {
        return;
    }

    await portainerRequest(`/api/stacks/${stack.Id}`, 'DELETE').catch(({ message }) => {
        throw new Error(message);
    });
};
