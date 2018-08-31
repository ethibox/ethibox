import jwt from 'jsonwebtoken';

describe('Applications Page', () => {
    before(() => {
        const defaultSettings = {
            storeRepositoryUrl: 'http://localhost:4444/test/apps.json',
            orchestratorIp: '192.168.99.100',
            isOrchestratorOnline: true,
        };
        cy.request('POST', '/test/reset', { defaultSettings });
        cy.request('POST', '/test/users', { users: [{ email: 'contact@ethibox.fr', password: 'myp@ssw0rd' }] });
        cy.request('POST', '/test/applications', { applications: [
            { releaseName: 'myapp', port: 30346, state: 'running', user: 1, pkg: 1 },
            { releaseName: 'myapp2', port: 30347, state: 'running', user: 1, pkg: 1 },
            { releaseName: 'myapp3', port: 30348, state: 'running', domainName: 'test.fr', user: 1, pkg: 2 },
        ] });
    });

    it('Should display applications', () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.get('.cards .card:first-child .header').contains('myapp');
        cy.get('.cards .card:first-child .meta').contains('Blog');
        cy.get('.cards .card:first-child .meta').contains('http://192.168.99.100:30346');
    });

    it('Should uninstall an application', () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.get('.cards .card:nth-child(2) .header').contains('myapp');
        cy.get('.cards .card:nth-child(2) .buttons .button:first-child').click();
        cy.get('.modal .button:nth-child(2)').click();
        cy.request('DELETE', '/test/applications/myapp2');
        cy.wait(3000);
        cy.get('.cards .card').should('have.length', 2);
        cy.get('.cards .card').should('not.have.length', 3);
        cy.get('.modal').should('not.exist');
    });

    it("Should edit application's domain", () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.get('.cards .card:first-child .buttons .button.dropdown').click();
        cy.get('.cards .card:first-child .menu .item').click();
        cy.get('.cards .card:first-child input').type('domain.fr{enter}');
        cy.wait(2000);
        cy.request('PUT', '/test/applications/myapp', { state: 'running' });
        cy.contains('.cards .card:first-child', 'http://domain.fr');
    });

    it("Should delete application's domain", () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.contains('.cards .card:last-child .meta', 'http://test.fr');
        cy.get('.cards .card:last-child .buttons .button.dropdown').click();
        cy.get('.cards .card:last-child .menu .item:last-child').click();
        cy.request('PUT', '/test/applications/myapp3', { state: 'running', action: null });
        cy.wait(3000);
        cy.contains('.cards .card:last-child .meta', 'http://192.168.99.100:30348');
    });

    it('Should block actions if orchestrator is offline', () => {
        cy.request('POST', '/test/settings', { settings: [
            { name: 'isOrchestratorOnline', value: false },
        ] });

        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.get('.cards .card:first-child .header').contains('myapp');
        cy.get('.cards .card:first-child .buttons .button:first-child').click();
        cy.get('.modal .button:nth-child(2)').click();
        cy.contains('.modal', 'Orchestrator connection failed!');
    });

    it.skip('Should display alert notification when an action stuck', () => {
        // TODO
    });

    it.skip('Should display alert notification when editing or installing app stuck', () => {
        // TODO
    });

    it.skip('Should allow to force application uninstallation if app has an error', () => {
        // TODO
    });

    it.skip('Should check DNS when domain editing', () => {
        // TODO
    });

    after(() => {
        cy.request('POST', '/test/reset');
    });
});
