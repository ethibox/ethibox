import jwt from 'jsonwebtoken';

const user = { email: 'user@ethibox.fr', password: 'myp@ssw0rd' };

describe('Store Page', () => {
    before(() => {
        cy.request('POST', 'http://localhost:3000/test/reset');
        cy.request('POST', 'http://localhost:3000/test/import');
        cy.request('POST', 'http://localhost:3000/test/users', { users: [{ email: 'user@ethibox.fr', password: 'myp@ssw0rd' }] });
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
        cy.get('a[href="/"]').click({ force: true, multiple: true });
        cy.contains('.grid > div:last-child h1', 'Wordpress');
    });

    it('Should display empty store if no templates', () => {
        cy.request('POST', 'http://localhost:3000/test/reset');
        cy.request('POST', 'http://localhost:3000/test/users', { users: [{ email: 'user@ethibox.fr', password: 'myp@ssw0rd' }] });
        cy.visit('/');
        cy.get('a[href="/"]').click({ force: true, multiple: true });
        cy.contains('main', 'Store is empty');
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

            cy.get('.grid > div:first-child').contains('Installing...');
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

        cy.request('POST', 'http://localhost:3000/test/users', { users: [{ id: 1, email: 'user@ethibox.fr', password: 'myp@ssw0rd' }] });

        cy.visit('/');

        cy.get('.grid > div:last-child button').click();
        cy.get('#first_name').type('Marty');
        cy.get('#last_name').type('Mcfly');

        cy.getWithinIframe('[name="cardnumber"]').type('4242424242424242');
        cy.getWithinIframe('[name="exp-date"]').type('1232');
        cy.getWithinIframe('[name="cvc"]').type('987');
        cy.getWithinIframe('[name="postal"]').type('12345');

        cy.get('#start_free_trial').click();
        cy.url().should('contain', '/apps');

        cy.request('http://localhost:3000/test/apps').as('apps');

        cy.get('@apps').then((response) => {
            const apps = response.body;
            const app = apps[0];

            expect(app.name).to.equal('Wordpress');

            cy.get('.grid > div:first-child').contains('Installing...');
        });
    });

    it('Should not show payment card form if SEPA is enabled', () => {
        cy.request('POST', 'http://localhost:3000/test/reset');
        cy.request('POST', 'http://localhost:3000/test/import');

        cy.request('POST', 'http://localhost:3000/test/settings', { settings: [
            { name: 'stripeEnabled', value: 'true' },
            { name: 'stripePublishableKey', value: Cypress.env('STRIPE_PUBLISHABLE_KEY') },
            { name: 'stripeSecretKey', value: Cypress.env('STRIPE_SECRET_KEY') },
        ] });

        cy.request('POST', 'http://localhost:3000/test/users', { users: [{ id: 1, email: 'user@ethibox.fr', password: 'myp@ssw0rd' }] });

        cy.visit('/settings');
        cy.get('#first_name').clear().type('Marty');
        cy.get('#last_name').clear().type('Mcfly');

        cy.get('#enable-iban').click();
        cy.getWithinIframe('input[name="iban"]').type('FR1420041010050500013M02606');

        cy.get('main > div:nth-child(2) button:last').click();
        cy.contains('.notification', 'Account informations saved successfully');

        cy.visit('/');

        cy.get('.grid > div:last-child button').click();
        cy.get('#start_free_trial').click();

        cy.url().should('contain', '/apps');
    });
});
