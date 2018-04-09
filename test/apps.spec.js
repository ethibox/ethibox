import jwt from 'jsonwebtoken';

describe('Applications Page', () => {
    before(() => {
        cy.request('GET', '/test/reset');
        cy.request('POST', '/test/users', { users: [{ email: 'contact@ethibox.fr', password: 'myp@ssw0rd' }] });
        cy.request('POST', '/test/packages', { packages: [{ name: 'etherpad', category: 'Editor' }, { name: 'owncloud', category: 'Storage' }] });
        cy.request('POST', '/test/applications', { applications: [
            { name: 'etherpad', releaseName: 'myapp', category: 'Editor', port: 30346, ip: '192.168.99.100', state: 'running', user: 1, pkg: 1 },
            { name: 'owncloud', releaseName: 'myapp2', category: 'Storage', port: 30347, ip: '192.168.99.100', state: 'running', domainName: 'test.fr', user: 1, pkg: 2 },
            { name: 'etherpad', releaseName: 'myapp3', category: 'Editor', port: 30348, ip: '192.168.99.100', state: 'running', user: 1, pkg: 1 },
        ] });
    });

    it('Should display applications', () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/', { onBeforeLoad: (win) => { win.fetch = null; win.localStorage.setItem('token', token); } });
        cy.get('.cards .card:first-child .header').contains('myapp');
        cy.get('.cards .card:first-child .meta').contains('Editor');
        cy.get('.cards .card:first-child .meta').contains('http://192.168.99.100:30346');
    });

    it('Should uninstall an application', () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/', { onBeforeLoad: (win) => { win.fetch = null; win.localStorage.setItem('token', token); } });
        cy.get('.cards .card:nth-child(2) .header').contains('myapp');
        cy.get('.cards .card:nth-child(2) .buttons .button:first-child').click();
        cy.get('.modal .button:nth-child(2)').click();
        cy.request('DELETE', '/test/applications/myapp2');
        cy.wait(2000);
        cy.get('.cards .card').should('have.length', 2);
        cy.get('.cards .card').should('not.have.length', 3);
    });

    it('Should edit domain of an application', () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/', { onBeforeLoad: (win) => { win.fetch = null; win.localStorage.setItem('token', token); } });
        cy.get('.cards .card:first-child .buttons .button.dropdown').click();
        cy.get('.cards .card:first-child .menu .item').click();
        cy.get('.cards .card:first-child input').type('domain.fr{enter}');
        cy.wait(2000);
        cy.request('PUT', '/test/applications/myapp', { state: 'running' });
        cy.contains('.cards .card:first-child .meta', 'https://domain.fr');
    });

    it('Should remove domain of an application', () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/', { onBeforeLoad: (win) => { win.fetch = null; win.localStorage.setItem('token', token); } });
        cy.get('.cards .card:last-child .buttons .button.dropdown').click();
        cy.get('.cards .card:last-child .menu .item:last-child').click();
        cy.request('PUT', '/test/applications/myapp3', { state: 'running' });
        cy.contains('.cards .card:last-child .meta', 'http://192.168.99.100:30348');
    });

    /* it.skip('Display error if operation is too long', () => {
        // TODO
    }); */
});
