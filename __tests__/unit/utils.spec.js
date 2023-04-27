import { getDomainIp, checkDnsRecord, checkDomain, decodeUnicode } from '@lib/utils';

describe('Given utils', () => {
    describe('When getDomainIp() is executed', () => {
        it('Should return the IP of the domain', async () => {
            const domain = 'ethibox.fr';

            const ip = await getDomainIp(domain);

            expect(ip).toBeDefined();
        });
    });

    describe('When getDomainIp() is executed with localhost', () => {
        it('Should return 127.0.0.1', async () => {
            const domain = 'localhost';

            const ip = await getDomainIp(domain);

            expect(ip).toBe('127.0.0.1');
        });
    });

    describe('When getDomainIp() is executed with an invalid domain', () => {
        it('Should return false', async () => {
            const domain = 'bad.domain';

            const ip = await getDomainIp(domain);

            expect(ip).toBe(false);
        });
    });

    describe('When checkDnsRecord() is executed', () => {
        it('Should return true', async () => {
            const domain = 'ethibox.fr';
            const ip = await getDomainIp(domain);

            const result = await checkDnsRecord(domain, ip);

            expect(result).toBe(true);
        });
    });

    describe('When checkDnsRecord() is executed with an invalid domain', () => {
        it('Should return error', async () => {
            const domain = 'bad.domain';
            const ip = await getDomainIp(domain);

            await checkDnsRecord(domain, ip).catch(({ message }) => {
                expect(message).toBe('DNS record not found');
            });
        });
    });

    describe('When checkDnsRecord() is executed with a localhost domain', () => {
        it('Should not return error', async () => {
            const domain = 'localhost';
            const ip = await getDomainIp(domain);

            const result = await checkDnsRecord(domain, ip);

            expect(result).toBe(true);
        });
    });

    describe('When checkDomain() is executed with a valid domain', () => {
        it('Should return true', async () => {
            const domain = 'custom.localhost';

            const result = await checkDomain(domain);

            expect(result).toBe(true);
        });
    });

    describe('When checkDomain() is executed with an invalid domain', () => {
        it('Should return false', async () => {
            const check1 = await checkDomain('wordpress.localhost');
            const check2 = await checkDomain('wordpress1.localhost');

            expect(check1).toBe(false);
            expect(check2).toBe(false);
        });
    });

    describe('When decodeUnicode() is executed', () => {
        it('Should return the decoded string', () => {
            const str = '\\u0026';

            const result = decodeUnicode(str);

            expect(result).toBe('&');
        });
    });
});
