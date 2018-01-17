import jwtDecode from 'jwt-decode';
import sha1 from 'node-sha1';
import socketIo from 'socket.io';
import { listApplications } from './k8sClient';
import { isAuthenticate } from './utils';

const interval = 5000;

export default (server) => {
    const io = socketIo(server);
    const authenticateUsers = [];

    setInterval(async () => {
        const apps = await listApplications();
        authenticateUsers.forEach(({ socketID, email }) => {
            const emailSha1 = sha1(email);
            const userApps = apps.filter(a => a.email === emailSha1);
            io.sockets.to(socketID).emit('listApplications', userApps);
        });
    }, interval);

    io.on('connection', async (socket) => {
        const { token } = socket.handshake.query;
        if (isAuthenticate(token)) {
            const { email } = jwtDecode(token);
            const emailSha1 = sha1(email);

            const apps = await listApplications();
            const userApps = apps.filter(a => a.email === emailSha1);
            socket.emit('listApplications', userApps);

            authenticateUsers.push({ socketID: socket.id, email });

            socket.on('disconnect', () => {
                const disconnectUserindex = authenticateUsers.findIndex(user => user.socketID === socket.id);
                authenticateUsers.splice(disconnectUserindex, 1);
            });
        }
    });

    return io;
};
