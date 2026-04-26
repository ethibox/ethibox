import { App, User } from '../../lib/orm';
import { download } from '../../lib/docker';

export default async (req, res) => {
    const { releaseName } = req.query;

    const user = await User.findOne({ where: { email: req.headers['x-user-email'] }, raw: true }).catch(() => false);

    const app = await App.findOne({ where: { releaseName, userId: user.id } }).catch(() => false);

    if (!releaseName || !app || !user) return;

    res.setHeader('Content-Disposition', `attachment; filename="${releaseName}.tar"`);
    res.setHeader('Content-Type', 'application/x-tar');

    const stream = await download(releaseName);
    stream.stdout.pipe(res);
};
