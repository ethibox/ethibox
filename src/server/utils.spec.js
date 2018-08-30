import { checkDnsRecord } from './utils';

test('Check DNS Record', async () => {
    const domain = 'test.fr';
    const serverIp = '127.0.0.1';
    const badServerIp = '9.9.9.9';

    expect(await checkDnsRecord(domain, serverIp)).toBe(true);
    expect(await checkDnsRecord(domain, badServerIp)).toBe(false);
});
