import { jest } from '@jest/globals';
import { EventEmitter } from 'node:events';
import { PassThrough, Readable } from 'node:stream';
import { text } from 'node:stream/consumers';
import { TEST_EMAIL, TEST_PASSWORD } from '../../lib/constants';

jest.unstable_mockModule('../../lib/docker', () => ({
    download: jest.fn(),
    cancelDownload: jest.fn(),
}));

const { download } = await import('../../lib/docker');
const { User, App, sequelize } = await import('../../lib/orm');
const { default: handler } = await import('../../pages/api/download');

const OTHER_EMAIL = 'other@example.com';
const RELEASE_NAME = 'wordpress1';

const fakeBackup = (content) => Object.assign(new EventEmitter(), { stdout: Readable.from(content ? [content] : []) });

const requestDownload = (email) => new Promise((resolve) => {
    const res = Object.assign(new PassThrough(), { setHeader: jest.fn(), status: jest.fn().mockReturnThis() });

    res.json = (body) => resolve({ status: res.status.mock.calls[0][0], body });
    text(res).then((body) => resolve({ status: 200, body, headers: Object.fromEntries(res.setHeader.mock.calls) }));

    handler({ query: { releaseName: RELEASE_NAME }, headers: { 'x-user-email': email } }, res);
});

beforeAll(async () => {
    await sequelize.sync({ force: true });

    const owner = await User.create({ email: TEST_EMAIL, password: TEST_PASSWORD });
    await User.create({ email: OTHER_EMAIL, password: TEST_PASSWORD });
    await App.create({ releaseName: RELEASE_NAME, domain: `${RELEASE_NAME}.localhost`, userId: owner.id });
});

test('Should return 401 when user is not logged in', async () => {
    const { status } = await requestDownload(undefined);

    expect(status).toBe(401);
});

test('Should return 404 when app belongs to another user', async () => {
    const { status } = await requestDownload(OTHER_EMAIL);

    expect(status).toBe(404);
});

test('Should return 500 when backup is empty', async () => {
    download.mockResolvedValue(fakeBackup(''));

    const { status } = await requestDownload(TEST_EMAIL);

    expect(status).toBe(500);
});

test('Should stream backup as tar file', async () => {
    download.mockResolvedValue(fakeBackup('tar content'));

    const { status, body, headers } = await requestDownload(TEST_EMAIL);

    expect(status).toBe(200);
    expect(body).toBe('tar content');
    expect(headers['Content-Disposition']).toBe(`attachment; filename="${RELEASE_NAME}.tar"`);
    expect(download).toHaveBeenCalledWith(RELEASE_NAME);
});
