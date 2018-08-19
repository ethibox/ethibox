import fetchMock from 'fetch-mock';
import { checkOrchestratorConnection } from './connector';

test('Check orchestrator connection', async () => {
    const orchestratorEndpoint = 'https://192.168.99.100:8443';
    const orchestratorToken = 'mytoken';

    await fetchMock.mock(`${orchestratorEndpoint}/healthz`, 'ok');
    const isOrchestratorOnline = await checkOrchestratorConnection(orchestratorEndpoint, orchestratorToken);
    fetchMock.restore();

    expect(isOrchestratorOnline).toBe(true);

    expect(await checkOrchestratorConnection()).toBe(false);
});
