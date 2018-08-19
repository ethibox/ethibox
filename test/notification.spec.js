import jwt from 'jsonwebtoken';

describe('Notification', () => {
    beforeEach(() => {
        cy.request('GET', '/test/reset');
        cy.request('POST', '/test/users', { users: [{ email: 'contact@ethibox.fr', password: 'myp@ssw0rd', isAdmin: true }] });
    });

    it('Should display alert notification when orchestrator connection failed', () => {
        cy.request('POST', '/test/settings', { settings: [
            { name: 'orchestratorName', value: 'kubernetes' },
            { name: 'orchestratorEndpoint', value: 'https://192.168.99.100:8443' },
            { name: 'orchestratorToken', value: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IiJ9.eyJpc3MiOiJrdWJlca' },
            { name: 'isOrchestratorOnline', value: false },
        ] });

        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.contains('.ui-alerts', 'Orchestrator connection failed!');
    });

    it('Should display notification when orchestrator configuration is missing', () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.contains('.ui-alerts', 'You need to configure orchestrator configuration.');
    });

    it('Should display alert notification when Internal Server Error', () => {
        cy.server();
        cy.route({ method: 'POST', url: '**/graphql', response: {}, status: 500 });
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.contains('.ui-alerts', 'Internal Server Error');
    });
});
