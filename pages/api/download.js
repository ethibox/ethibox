import { pipeline } from 'node:stream';
import { App, User } from '../../lib/orm';
import { download, cancelDownload } from '../../lib/docker';
import { useTranslation } from '../../lib/utils';

export const config = { api: { responseLimit: false } };

export default async (req, res) => {
    const t = useTranslation(req?.headers?.['accept-language']);
    const { releaseName } = req.query;

    const user = await User.findOne({ where: { email: req.headers['x-user-email'] }, raw: true }).catch(() => false);

    if (!user) return res.status(401).json({ message: t('unauthorized') });

    const app = await App.findOne({ where: { releaseName, userId: user.id } });

    if (!app) return res.status(404).json({ message: t('app_not_found') });

    const backup = await download(app.releaseName);

    backup.once('error', () => {});

    return backup.stdout.once('readable', () => {
        if (!backup.stdout.readableLength) return res.status(500).json({ message: t('download_failed') });

        backup.once('exit', (code) => code && res.destroy());

        res.setHeader('Content-Disposition', `attachment; filename="${app.releaseName}.tar"`);
        res.setHeader('Content-Type', 'application/x-tar');

        return pipeline(backup.stdout, res, (err) => err && cancelDownload(app.releaseName));
    });
};
