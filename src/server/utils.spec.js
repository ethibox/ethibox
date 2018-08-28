import fetchMock from 'fetch-mock';
import { checkOrchestratorConnection, checkDnsRecord } from './utils';

test('Check orchestrator connection', async () => {
    const orchestratorEndpoint = 'https://192.168.99.100:8443';
    const orchestratorToken = 'mytoken';

    await fetchMock.mock(`${orchestratorEndpoint}/healthz`, 'ok');
    const isOrchestratorOnline = await checkOrchestratorConnection(orchestratorEndpoint, orchestratorToken);
    fetchMock.restore();

    expect(isOrchestratorOnline).toBe(true);

    expect(await checkOrchestratorConnection()).toBe(false);
});

test('Check DNS Record', async () => {
    const domain = 'test.fr';
    const serverIp = '127.0.0.1';
    const badServerIp = '9.9.9.9';

    expect(await checkDnsRecord(domain, serverIp)).toBe(true);
    expect(await checkDnsRecord(domain, badServerIp)).toBe(false);
});
