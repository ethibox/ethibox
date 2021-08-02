import jwt from 'jsonwebtoken';

const user = { email: 'admin@ethibox.fr', password: 'myp@ssw0rd', isAdmin: true };

describe('Admin Page', () => {
    before(() => {
        cy.request('POST', 'http://localhost:3000/test/reset');
        cy.request('POST', 'http://localhost:3000/test/users', { users: [
            user,
            { email: 'user@ethibox.fr', password: 'myp@ssw0rd' },
        ] });
        cy.request('POST', 'http://localhost:3000/test/settings', { settings: [
            { name: 'rootDomain', value: 'localhost' },
            { name: 'stripeEnabled', value: 'false' },
            { name: 'stripePublishableKey', value: '' },
            { name: 'stripeSecretKey', value: '' },
        ] });
        cy.request({
            method: 'POST',
            url: 'http://localhost:3000/graphql',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: `mutation {
                login(email: "${user.email}", password: "${user.password}") { token }
            }` }),
        })
            .its('body')
            .then(({ data }) => { user.id = jwt.decode(data.login.token).id; });
    });

    beforeEach(() => {
        cy.setLocalStorage('token', jwt.sign(user, 'mys3cr3t', { expiresIn: '1d' }));
    });

    it('Should display admin page for admin only', () => {
        cy.setLocalStorage('token', jwt.sign({ email: 'user@ethibox.fr' }, 'mys3cr3t', { expiresIn: '1d' }));
        cy.visit('/admin');
        cy.url().should('not.contain', '/admin');
    });

    it('Should update admin settings', () => {
        cy.visit('/admin');
        cy.get('#root_domain').clear().type('new.ethibox.fr');
        cy.get('main > div span:last-child button').click();
        cy.contains('.notification', 'Settings save');
    });

    it('Should enable stripe', () => {
        cy.visit('/admin');
        cy.get('#stripe_enabled').select('true');
        cy.get('#stripe_publishable_key').clear().type(Cypress.env('STRIPE_PUBLISHABLE_KEY'));
        cy.get('#stripe_secret_key').clear().type(Cypress.env('STRIPE_SECRET_KEY'));
        cy.get('main > div span:last-child button').click();
        cy.contains('.notification', 'Settings save');
    });

    it('Should not enable stripe if invalid keys', () => {
        cy.visit('/admin');
        cy.get('#stripe_enabled').select('true');
        cy.get('#stripe_publishable_key').clear().type('pk_badkey');
        cy.get('#stripe_secret_key').clear().type('sk_badkey');
        cy.get('main > div span:last-child button').click();
        cy.contains('.notification', 'Invalid stripe keys');
    });

    it('Should upload templates', () => {
        cy.visit('/admin');
        const templates = 'templates.json';
        cy.get('input[type=file]').attachFile(templates);
    });
});
