import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { EXCLUDED_ENV_VARS, TEMPLATES_URL } from './constants.js';

const docker = (args, options = {}) => {
    const env = { ...process.env, ...options.env };
    EXCLUDED_ENV_VARS.forEach((key) => delete env[key]);

    return execFileSync('/usr/bin/docker', args, { ...options, env, encoding: 'utf-8' });
};

export const init = async () => {
    const swarmStatus = docker(['info', '--format', '{{.Swarm.LocalNodeState}}']).trim();

    if (swarmStatus !== 'active') docker(['swarm', 'init']);

    if (!docker(['network', 'ls', '-qf', 'name=traefik-net']).trim()) {
        docker(['network', 'create', '-d', 'overlay', 'traefik-net']);
    }

    const input = await fetch(TEMPLATES_URL.replace('templates.json', 'stacks/traefik.yml')).then((r) => r.text());

    if (!docker(['service', 'ls', '-qf', 'name=traefik_traefik']).trim()) {
        docker(['stack', 'deploy', '--resolve-image=never', '-d', '-c', '-', 'traefik'], { input });
    }

    return true;
};

export const deploy = async (stackfile, releaseName, envs = []) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(releaseName)) throw new Error('Invalid release name');

    const localStack = `${process.cwd()}/data/${releaseName}.yml`;

    const input = existsSync(localStack) ? readFileSync(localStack, 'utf-8') : await fetch(stackfile).then((r) => r.text());
    const env = Object.fromEntries(envs.map((e) => [e.name, e.value]));

    docker(['stack', 'deploy', '--resolve-image=never', '-d', '-c', '-', releaseName], { input, env });

    return true;
};

export const remove = async (releaseName) => {
    const services = docker(['service', 'ls', '-qf', `label=com.docker.stack.namespace=${releaseName}`]).trim();

    if (services) {
        docker(['service', 'rm', ...services.split('\n')]);
    }

    const networks = docker(['network', 'ls', '-qf', `label=com.docker.stack.namespace=${releaseName}`]).trim();

    if (networks) {
        docker(['network', 'rm', ...networks.split('\n')]);
    }

    return true;
};

export default {
    init,
    deploy,
    remove,
};
