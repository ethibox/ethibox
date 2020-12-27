import jwt from 'jsonwebtoken';

const user = { email: 'user@ethibox.fr', password: 'myp@ssw0rd' };

describe('Settings Page', () => {
    before(() => {
        cy.request('POST', 'http://localhost:3000/test/reset');
        cy.request('POST', 'http://localhost:3000/test/settings', { settings: [
            { name: 'stripeEnabled', value: 'true' },
            { name: 'stripePublishableKey', value: Cypress.env('STRIPE_PUBLISHABLE_KEY') },
            { name: 'stripeSecretKey', value: Cypress.env('STRIPE_SECRET_KEY') },
        ] });
        cy.request('POST', 'http://localhost:3000/test/users', { users: [user] });
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

    it('Should add & remove payment card if stripe is enabled', () => {
        const token = jwt.sign(user, 'mys3cr3t', { expiresIn: '1d' });

        cy.request({
            method: 'POST',
            url: 'http://localhost:3000/graphql',
            headers: { 'Content-Type': 'application/json', 'x-access-token': token },
            body: JSON.stringify({ query: 'mutation { removePaymentMethod }' }),
        });

        cy.visit('/settings');

        cy.get('#first_name').clear().type('Marty');
        cy.get('#last_name').clear().type('Mcfly');

        cy.getWithinIframe('[name="cardnumber"]').type('4242424242424242');
        cy.getWithinIframe('[name="exp-date"]').type('1232');
        cy.getWithinIframe('[name="cvc"]').type('987');
        cy.getWithinIframe('[name="postal"]').type('12345');

        cy.get('main > div:nth-child(2) button:last').click();
        cy.contains('.notification', 'Account informations saved successfully');

        cy.get('#change_card').click();
        cy.get('#confirm').click();
    });

    it('Should display error if payment card is bad', () => {
        const token = jwt.sign(user, 'mys3cr3t', { expiresIn: '1d' });

        cy.request('POST', 'http://localhost:3000/test/settings', { settings: [
            { name: 'stripeEnabled', value: 'true' },
            { name: 'stripePublishableKey', value: Cypress.env('STRIPE_PUBLISHABLE_KEY') },
            { name: 'stripeSecretKey', value: Cypress.env('STRIPE_SECRET_KEY') },
        ] });

        cy.request({
            method: 'POST',
            url: 'http://localhost:3000/graphql',
            headers: { 'Content-Type': 'application/json', 'x-access-token': token },
            body: JSON.stringify({ query: 'mutation { removePaymentMethod }' }),
        });

        cy.visit('/settings');

        cy.get('#first_name').clear().type('Marty');
        cy.get('#last_name').clear().type('Mcfly');

        cy.getWithinIframe('[name="cardnumber"]').type('4000000000000069');
        cy.getWithinIframe('[name="exp-date"]').type('1232');
        cy.getWithinIframe('[name="cvc"]').type('987');
        cy.getWithinIframe('[name="postal"]').type('12345');

        cy.get('main > div:nth-child(2) button:last').click();
        cy.contains('.notification', 'Your card has expired');
    });

    it('Should not show payment method if stripe disabled', () => {
        cy.request('POST', 'http://localhost:3000/test/settings', { settings: [{ name: 'stripeEnabled', value: 'false' }] });
        cy.visit('/settings');
        cy.get('main').should('not.contain', 'Card number');
    });

    it('Should delete account', () => {
        cy.visit('/settings');
        cy.get('.mt-8 > .flex > [type="button"]').click();
        cy.get('button.bg-red-700').click();
        cy.url().should('contain', '/login');
    });

    it('Should set first and last name', () => {
        cy.request('POST', 'http://localhost:3000/test/reset');
        cy.request('POST', 'http://localhost:3000/test/users', { users: [user] });
        cy.visit('/settings');
        cy.get('#first_name').type('Marty');
        cy.get('#last_name').type('Mcfly');
        cy.get('main > div:nth-child(2) button:last').click();
        cy.contains('.notification', 'Account informations saved successfully');
    });
});
