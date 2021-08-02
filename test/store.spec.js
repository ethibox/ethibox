import jwt from 'jsonwebtoken';

const user = { email: 'user@example.com', password: 'myp@ssw0rd' };

describe('Store Page', () => {
    before(() => {
        cy.request('POST', 'http://localhost:3000/test/reset');
        cy.request('POST', 'http://localhost:3000/test/import');
        cy.request('POST', 'http://localhost:3000/test/users', { users: [{ email: 'user@example.com', password: 'myp@ssw0rd' }] });
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

    it('Should display templates', () => {
        cy.visit('/');
        cy.contains('.grid > div:last-child h1', 'Wordpress');
    });

    it('Should display empty store if no templates', () => {
        cy.request('POST', 'http://localhost:3000/test/reset');
        cy.request('POST', 'http://localhost:3000/test/users', { users: [{ email: 'user@example.com', password: 'myp@ssw0rd' }] });
        cy.visit('/');
        cy.contains('main', 'You have no templates');
    });

    it('Should install an application', () => {
        cy.request('POST', 'http://localhost:3000/test/import');
        cy.request('POST', 'http://localhost:3000/test/settings', { settings: [{ name: 'stripeEnabled', value: 'false' }] });
        cy.visit('/');
        cy.get('.grid > div:last-child button').click();
        cy.url().should('contain', '/apps');

        cy.request('http://localhost:3000/test/apps').as('apps');

        cy.get('@apps').then((response) => {
            const apps = response.body;
            const app = apps[0];

            expect(app.name).to.equal('Wordpress');

            cy.get('.grid > div:first-child').contains('Action in progress');
        });
    });

    it('Should install a paid application', () => {
        const token = jwt.sign(user, 'mys3cr3t', { expiresIn: '1d' });

        cy.request('POST', 'http://localhost:3000/test/reset');
        cy.request('POST', 'http://localhost:3000/test/import');

        cy.request('POST', 'http://localhost:3000/test/settings', { settings: [
            { name: 'stripeEnabled', value: 'true' },
            { name: 'stripePublishableKey', value: Cypress.env('STRIPE_PUBLISHABLE_KEY') },
            { name: 'stripeSecretKey', value: Cypress.env('STRIPE_SECRET_KEY') },
        ] });

        cy.request({
            method: 'POST',
            url: 'http://localhost:3000/graphql',
            headers: { 'Content-Type': 'application/json', 'x-access-token': token },
            body: JSON.stringify({ query: `mutation {
                removePaymentMethod
            }` }),
        });

        cy.request('POST', 'http://localhost:3000/test/users', { users: [{ id: 1, email: 'user@example.com', password: 'myp@ssw0rd' }] });

        cy.visit('/');

        cy.get('.grid > div:last-child button').click();

        cy.url().should('contain', 'checkout.stripe.com');
    });
});
