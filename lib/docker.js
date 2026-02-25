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
        docker(['network', 'create', '-d', 'overlay', '--subnet=10.200.0.0/16', 'traefik-net']);
    }

    const input = await fetch(TEMPLATES_URL.replace('templates.json', 'stacks/traefik.yml')).then((r) => r.text());

    if (!docker(['service', 'ls', '-qf', 'name=traefik_traefik']).trim()) {
        docker(['stack', 'deploy', '--with-registry-auth', '--resolve-image=never', '-d', '-c', '-', 'traefik'], { input });
    }

    return true;
};

export const deploy = async (stackfile, releaseName, envs = []) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(releaseName)) throw new Error('Invalid release name');

    const localStack = `${process.cwd()}/data/${releaseName}.yml`;

    const input = existsSync(localStack) ? readFileSync(localStack, 'utf-8') : await fetch(stackfile).then((r) => r.text());
    const env = Object.fromEntries(envs.map((e) => [e.name, e.value]));

    docker(['stack', 'deploy', '--with-registry-auth', '--resolve-image=never', '-d', '-c', '-', releaseName], { input, env });

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

export const download = async (releaseName) => {
    const labelFilter = `label=com.docker.stack.namespace=${releaseName}`;
    const [volumes, services] = ['volume', 'service'].map((type) => docker([type, 'ls', '-qf', labelFilter]).trim().split('\n').filter(Boolean));

    const bindMounts = [...new Set(services.flatMap((id) => {
        const json = docker(['service', 'inspect', '--format', '{{json .Spec.TaskTemplate.ContainerSpec.Mounts}}', id]).trim();
        return (JSON.parse(json || 'null') || [])
            .filter((m) => m.Type === 'bind')
            .map((m) => m.Source.replace('{{ index .Service.Labels "com.docker.stack.namespace" }}', releaseName));
    }))];

    if (!volumes.length && !bindMounts.length) return null;

    const hostname = process.env.HOSTNAME || readFileSync('/etc/hostname', 'utf-8').trim();
    const selfMountsJSON = docker(['inspect', '--format', '{{json .Mounts}}', hostname]).trim();
    const selfMounts = JSON.parse(selfMountsJSON || '[]');
    const dataMount = selfMounts.find((m) => m.Destination === '/app/data');

    if (!dataMount) throw new Error('Could not determine source of /app/data');

    const mounts = [
        ...volumes.map((v) => `type=volume,source=${v},target=/backup/${v}`),
        ...bindMounts.map((v) => `type=bind,source=${v},target=/backup/${v}`),
        `type=${dataMount.Type},source=${dataMount.Source},target=/output`,
    ];

    const fileName = `${releaseName}-${Date.now()}.tar`;
    const serviceName = `backup-${releaseName}-${Date.now()}`;
    const env = { HOME: process.env.HOME, DOCKER_HOST: process.env.DOCKER_HOST };

    docker([
        'service', 'create', '-d', '--name', serviceName,
        '--replicas', '1', '--restart-condition', 'none',
        ...mounts.flatMap((m) => ['--mount', m]),
        'alpine', 'sh', '-c', `tar -cf /output/${fileName} -C / backup && chmod 666 /output/${fileName}`,
    ], { env });

    return new Promise((resolve, reject) => {
        const checker = setInterval(() => {
            try {
                const state = docker(['service', 'ps', serviceName, '--format', '{{.CurrentState}}'], { env }).trim();
                if (state.startsWith('Complete')) {
                    clearInterval(checker);
                    docker(['service', 'rm', serviceName], { env });
                    resolve(`${process.cwd()}/data/${fileName}`);
                } else if (/^(Failed|Shutdown|Rejected)/.test(state)) {
                    clearInterval(checker);
                    docker(['service', 'rm', serviceName], { env });
                    reject(new Error('Backup service failed'));
                }
            } catch (e) {
                clearInterval(checker);
                reject(e);
            }
        }, 2000);
    });
};

export default {
    init,
    deploy,
    remove,
    download,
};
