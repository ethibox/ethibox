import jwt from 'jsonwebtoken';

describe('Applications Page', () => {
    it('Should display packages', () => {
        cy.server();
        cy.route('POST', '**/api/graphql', { data: { packages: [{ name: 'etherpad', category: 'Editor' }, { name: 'owncloud', category: 'Storage' }] } });
        const token = jwt.sign({ email: 'contact@ethibox.fr' }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/', { onBeforeLoad: (win) => { win.fetch = null; win.localStorage.setItem('token', token); } });
        cy.get('.cards .card:first-child .header').contains('etherpad');
    });

    it('Should display applications', () => {
        cy.server();
        cy.route('POST', '**/api/graphql', { data: {
            applications: [{ name: 'etherpad', releaseName: 'myapp', category: 'Editor', port: 30346, ip: '192.168.99.100', state: 'running' }],
        } });

        const token = jwt.sign({ email: 'contact@ethibox.fr' }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/', { onBeforeLoad: (win) => { win.fetch = null; win.localStorage.setItem('token', token); } });
        cy.get('.cards .card:first-child .header').contains('myapp');
        cy.get('.cards .card:first-child .meta').contains('Editor');
        cy.get('.cards .card:first-child .meta').contains('http://192.168.99.100:30346');
    });

    it('Should install an application', () => {
        cy.server();
        cy.route('POST', '**/api/applications', { success: true, message: 'Application installed' });
        cy.route('POST', '**/api/graphql', { data: { packages: [{ name: 'etherpad', category: 'Editor' }, { name: 'owncloud', category: 'Storage' }] } });

        const token = jwt.sign({ email: 'contact@ethibox.fr' }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/', { onBeforeLoad: (win) => { win.fetch = null; win.localStorage.setItem('token', token); } });
        cy.get('.cards .card:first-child .buttons').click();
        cy.get('.cards .card:first-child input').type('myapp{enter}');
        cy.get('.cards .card:first-child .header').contains('myapp');
    });

    it('Should uninstall an application', () => {
        cy.server();
        cy.route('DELETE', '**/api/applications/myapp', { success: true, message: 'Application uninstalled' });
        cy.route('POST', '**/api/graphql', { data: {
            applications: [{ name: 'etherpad', releaseName: 'myapp', category: 'Editor', port: 30346, ip: '192.168.99.100', state: 'running' }],
        } });

        const token = jwt.sign({ email: 'contact@ethibox.fr' }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/', { onBeforeLoad: (win) => { win.fetch = null; win.localStorage.setItem('token', token); } });
        cy.get('.cards .card:first-child .header').contains('myapp');
        cy.get('.cards .card:first-child .buttons .button:first-child').click();
        cy.get('.modal .button:nth-child(2)').click();
        cy.route('POST', '**/api/graphql', { data: { applications: [] } });
        cy.wait(5000);
        cy.get('.cards').should('be.empty');
    });

    it('Should edit domain of an application', () => {
        cy.server();
        cy.route('PUT', '**/api/applications/myapp', { success: true, message: 'Application edited' });
        cy.route('POST', '**/api/graphql', { data: {
            applications: [{ name: 'etherpad', releaseName: 'myapp', category: 'Editor', port: 30346, ip: '192.168.99.100', state: 'running' }],
        } });

        const token = jwt.sign({ email: 'contact@ethibox.fr' }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/', { onBeforeLoad: (win) => { win.fetch = null; win.localStorage.setItem('token', token); } });
        cy.get('.cards .card:first-child .buttons .button.dropdown').click();
        cy.get('.cards .card:first-child .menu .item').click();
        cy.get('.cards .card:first-child input').type('domain.fr{enter}');
        cy.route('POST', '**/api/graphql', { data: {
            applications: [{ name: 'etherpad', domainName: 'domain.fr', releaseName: 'myapp', category: 'Editor', state: 'running' }],
        } });
        cy.wait(5000);
        cy.get('.cards .card:first-child .meta').contains('https://domain.fr');
    });

    it.skip('Should not install duplicate name application', () => {
        // TODO
    });

    it.skip('Should not display applications of another user', () => {
        // TODO
    });
});
