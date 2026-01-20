import dns from 'dns';
import { jest } from '@jest/globals';
import { isDisposableDomain, triggerWebhook, getDomainIp, isValidDomain, getCustomEnvs } from '../../lib/utils';

test('Should get domain IP', async () => {
    const ip = await getDomainIp('localhost');

    expect(ip).toBe('127.0.0.1');
});

test('Should check disposable email domains', async () => {
    const isDisposable = await isDisposableDomain('yopmail.com');
    expect(isDisposable).toBe(true);
});

test('Should not trigger webhook without URL', async () => {
    delete process.env.WEBHOOK_URL;

    const res = await triggerWebhook('APP_INSTALLED', { name: 'nextcloud' });

    expect(res).toBe(false);
});

test('Should trigger webhook successfully', async () => {
    process.env.WEBHOOK_URL = 'https://ethibox.fr';

    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve({ ok: true, status: 200 }));

    const res = await triggerWebhook('APP_INSTALLED', { name: 'nextcloud' });

    expect(res.ok).toBe(true);

    fetchMock.mockRestore();
});

test('Should fail webhook on invalid URL', async () => {
    process.env.WEBHOOK_URL = 'http://localhost:1234';

    const res = await triggerWebhook('APP_INSTALLED', { name: 'nextcloud' });

    expect(res).toBe(false);
});

test('Should reject invalid domain format', async () => {
    await expect(isValidDomain('invalid-domain', '127.0.0.1')).rejects.toThrow('domain_invalid');
    await expect(isValidDomain('http://example.com', '127.0.0.1')).rejects.toThrow('domain_invalid');
});

test('Should reject domain with wrong IP', async () => {
    await expect(isValidDomain('example.com', '127.0.0.1')).rejects.toThrow('domain_dns_error');
});

test('Should validate domain with correct IP', async () => {
    expect(await isValidDomain('ethibox.fr', '51.210.159.184')).toBe(true);
});

test('Should allow custom domain names', async () => {
    expect(await isValidDomain('custom.localhost', '127.0.0.1')).toBe(true);
});

test('Should reject domains with app names and numbers', async () => {
    await expect(isValidDomain('wordpress.localhost', '127.0.0.1')).rejects.toThrow('domain_reserved');
    await expect(isValidDomain('wordpress1.localhost', '127.0.0.1')).rejects.toThrow('domain_reserved');
});

test('Should allow custom domain names with app name and numbers from other root domains', async () => {
    const originalLookup = dns.lookup;
    dns.lookup = jest.fn((_, __, callback) => {
        callback(null, '127.0.0.1');
    });

    expect(await isValidDomain('nextcloud1.example.com', '127.0.0.1')).toBe(true);

    dns.lookup = originalLookup;
});

test('Should get custom envs only for corresponding apps', () => {
    process.env.CUSTOM_ENV_WEKAN_SMTP_HOST = 'smtp.example.com';
    process.env.CUSTOM_ENV_NEXTCLOUD_OBJECTSTORE_S3_HOST = 's3.example.com';

    const envs = getCustomEnvs('nextcloud');

    expect(envs).toEqual([{ name: 'OBJECTSTORE_S3_HOST', value: 's3.example.com' }]);
});
