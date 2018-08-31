import jwt from 'jsonwebtoken';

describe('Settings page', () => {
    before(() => {
        cy.request('POST', '/test/reset', { defaultSettings: { disableOrchestratorCheck: true } });
        cy.request('POST', '/test/users', { users: [{ email: 'contact@ethibox.fr', password: 'myp@ssw0rd', isAdmin: true }] });
    });

    it('Should change user password', () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/settings', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.get('input[name="password"]').type('mynewp@ass0rd');
        cy.get('input[name="confirmPassword"]').type('mynewp@ass0rd');
        cy.get('button[name="password"]').click();
        cy.contains('.modal', 'Password updated!');
    });

    it('Should display an error if passwords do not match', () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/settings', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.get('input[name="password"]').type('mynewp@ass0rd');
        cy.get('input[name="confirmPassword"]').type('mynewbadp@ass0rd');
        cy.get('button[name="password"]').click();
        cy.contains('.error', 'Passwords doesn\'t match');
    });

    it('Should display an error if passwords is too short', () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/settings', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.get('input[name="password"]').type('new');
        cy.get('input[name="confirmPassword"]').type('new');
        cy.get('button[name="password"]').click();
        cy.contains('.error', 'Your password must be at least 6 characters');
    });

    it('Should setup orchestrator settings', () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/settings', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.get('.dropdown[name="orchestratorName"]').click();
        cy.get('.dropdown[name="orchestratorName"] .item').contains('Kubernetes').click();
        cy.get('input[name="orchestratorEndpoint"]').type('https://192.168.99.100:8443');
        cy.get('input[name="orchestratorToken"]').type('eyJhbGciOiJSUzI1NiIsImtpZCI6IiJ9.eyJpc3MiOiJrdWJlca');
        cy.get('button[name="save"]').click();
        cy.contains('.modal', 'Configuration updated!');
    });

    it('Should import store packages with apps.json file', () => {
        cy.request('DELETE', '/test/packages');
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/settings', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.get('input[name="storeRepositoryUrl"]').type('{selectall}{del}http://localhost:4444/test/apps.json');
        cy.get('button[name="save"]').click();
        cy.contains('.modal', 'Configuration updated!');
        cy.request('GET', '/test/packages').then((response) => {
            expect(response.body).to.have.lengthOf(2);
        });
    });

    it('Should no import bad apps.json file', () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/settings', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.get('input[name="storeRepositoryUrl"]').type('{selectall}{del}http://bad-url.com/apps.json');
        cy.get('button[name="save"]').click();
        cy.contains('.modal', 'Invalid store repository URL');
    });

    it('Should enable monetization', () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/settings', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.get('.monetization .checkbox').click();
        cy.get('input[name="stripeSecretKey"]').type(Cypress.env('STRIPE_SECRET_KEY'));
        cy.get('input[name="stripePublishableKey"]').type(Cypress.env('STRIPE_PUBLISHABLE_KEY'));
        cy.get('input[name="stripePlanName"]').type(Cypress.env('STRIPE_PLAN_NAME'));
        cy.get('button[name="save"]').click();
        cy.contains('.modal', 'Configuration updated!');
        cy.get('.modal button').click();
        cy.get('.subscribe .checkbox').click();
        cy.get('.message').not('Bad stripe publishable key');
    });
});
