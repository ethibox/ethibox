const initialApplications = [
    { id: 0, name: 'Wordpress', logo: 'https://framapic.org/q4P5asK7T3rG/lwrvyHc3wRm0.png', category: 'Blog' },
    { id: 1, name: 'Rocket.Chat', logo: 'https://framapic.org/DdPKNc1y7wTK/dfxmnUyBsWkj.png', category: 'Chat' },
    { id: 2, name: 'Ghost', logo: 'https://framapic.org/B4x7MtG9cuHi/hRytuK7P1YHE.png', category: 'Blog' },
    { id: 3, name: 'Mastodon', logo: 'https://framapic.org/BwgMN9ai5DoL/FVYYCYkf2TJ9.png', category: 'Social Network' },
    { id: 4, name: 'Roundcube', logo: 'https://framapic.org/xt1ViV3I7mSe/lW5ONMCuGPgh.image', category: 'Webmail' },
    { id: 5, name: 'ownCloud', logo: 'https://framapic.org/QdfgE4rRnsxX/h0xNKhj0BxpW.png', category: 'Cloud' },
    { id: 6, name: 'Piwik', logo: 'https://framapic.org/xxOf4D1WT2Fq/SaGejrhkhLkS.image', category: 'Analytics' },
    { id: 7, name: 'MediaWiki', logo: 'https://framapic.org/Y8v7vD9ueL0G/bZU879yWimmw.image', category: 'Wiki' },
    { id: 8, name: 'Openbazaar', logo: 'https://framapic.org/L4UEYaCK9oEi/XFj8azLCzrwE.png', category: 'E-Commerce' },
    { id: 9, name: 'Wekan', logo: 'https://framapic.org/K0myLKsOZv1P/wijRbnUVxKaN.png', category: 'Project Management' },
    { id: 10, name: 'Discourse', logo: 'https://framapic.org/bMUJaZhxvQAo/YAccRjOdtY8X.png', category: 'Forum' },
    { id: 11, name: 'Searx', logo: 'https://framapic.org/VeO7UlkcPXJE/0iS7VRr6oLV8.png', category: 'Search Engine' },
    { id: 12, name: 'Wallabag', logo: 'https://framapic.org/AQ6uqkzuuULr/tDJqYlxUCTPH.png', category: 'Sync' },
    { id: 13, name: 'Jitsi Meet', logo: 'https://framapic.org/wKb9gHWdklRT/cjZ21RnczMLK.png', category: 'Chat' },
    { id: 14, name: 'Prestashop', logo: 'https://framapic.org/5HkqwMr8V15j/zhbraZ7YdfFY.png', category: 'E-Commerce' },
    { id: 15, name: 'Etherpad', logo: 'https://framapic.org/B4pD2wkMwxob/yj5ucxt4XzRW.image', category: 'Editor' },
    { id: 16, name: 'Odoo', logo: 'https://framapic.org/Hkjo9vCoHsLJ/kVn8IdYWMEkL.png', category: 'Erp' },
    { id: 17, name: 'Gitlab', logo: 'https://framapic.org/J2Sj7vrmMMj8/Ffg6lrxR4qbs.png', category: 'Development' },
    { id: 18, name: 'Diaspora', logo: 'https://framapic.org/ftflfZX8gR0Z/OxvgCbRovqDz.png', category: 'Social Network' },
    { id: 19, name: 'Taiga', logo: 'https://framapic.org/L8FrSElxF6wt/jXVB9Ztol14h.png', category: 'Project Management' },
    { id: 20, name: 'Zabbix', logo: 'https://framapic.org/Z6FVH7hON2t0/KiIPBLKPUYOM.png', category: 'Monitoring' },
    { id: 21, name: 'Sentry', logo: 'https://framapic.org/k9S6SoBauJIl/wtS0E4emlD2E.png', category: 'Monitoring' },
    { id: 22, name: 'Jenkins', logo: 'https://framapic.org/XvbxzAFmHl9E/zNC7LQokCFu8.png', category: 'Development' },
    { id: 23, name: 'Gogs', logo: 'https://framapic.org/GKQeyqogaQ5f/iAi0Y26vpeOQ.png', category: 'Development' },
];

export default (state = { applications: initialApplications }, action) => {
    switch (action.type) {
        case 'INSTALL_APPLICATION': {
            const newId = state.applications.reduce((maxId, app) => Math.max(app.id, maxId), -1) + 1;
            const newApplication = { id: newId, ...action.application };
            return { ...state, applications: [...state.applications, newApplication] };
        }

        case 'UPDATE_APPLICATION': {
            const applications = state.applications.map((app) => {
                if (app.id === action.application.id) {
                    return { ...app, ...action.application };
                }
                return app;
            });
            return { ...state, applications };
        }

        case 'UNINSTALL_APPLICATION': {
            return { ...state, applications: state.applications.filter(app => app.id !== action.id) };
        }

        default: {
            return state;
        }
    }
};
