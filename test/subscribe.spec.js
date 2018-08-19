import jwt from 'jsonwebtoken';

describe('Subscribe', () => {
    it('Should restrict applications access and redirect user if he is not subscribed and monetization is enabled', () => {
        cy.request('GET', '/test/reset');
        cy.request('POST', '/test/users', { users: [{ email: 'contact@ethibox.fr', password: 'myp@ssw0rd', isSubscribed: false }] });
        cy.request('POST', '/test/settings', { settings: [{ name: 'isMonetizationEnabled', value: true }] });
        cy.request('POST', '/test/packages', { packages: [{ name: 'etherpad', category: 'Editor' }, { name: 'owncloud', category: 'Storage' }] });

        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/store', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.get('.cards .card:first-child .buttons').click();
        cy.get('.cards .card:first-child input').type('myapp{enter}');
        cy.wait(1000);
        cy.contains('.modal', 'Subscription is required');
    });

    it('Should give applications access if user is subscribed and monetization is enabled', () => {
        cy.request('GET', '/test/reset');
        cy.request('POST', '/test/users', { users: [{ email: 'contact@ethibox.fr', password: 'myp@ssw0rd', isSubscribed: true }] });
        cy.request('POST', '/test/settings', { settings: [{ name: 'isMonetizationEnabled', value: true }] });
        cy.request('POST', '/test/packages', { packages: [{ name: 'etherpad', category: 'Editor' }, { name: 'owncloud', category: 'Storage' }] });

        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/store', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.get('.cards .card:first-child .buttons').click();
        cy.get('.cards .card:first-child input').type('myapp{enter}');
        cy.get('.cards .card:first-child .header').contains('myapp');
    });

    it('Should validate subscription if data is correct', () => {
        cy.request('GET', '/test/reset');
        cy.request('POST', '/test/users', { users: [{ email: 'contact@ethibox.fr', password: 'myp@ssw0rd', isSubscribed: false }] });
        cy.request('POST', '/test/settings', { settings: [
            { name: 'isMonetizationEnabled', value: true },
            { name: 'stripeSecretKey', value: Cypress.env('STRIPE_SECRET_KEY') },
            { name: 'stripePublishableKey', value: Cypress.env('STRIPE_PUBLISHABLE_KEY') },
            { name: 'stripePlanName', value: Cypress.env('STRIPE_PLAN_NAME') },
            { name: 'monthlyPrice', value: '0€' },
        ] });

        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/subscribe', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.get('.message.error').should('not.be.visible');
        cy.get('input[name="name"]').type('John Doe');
        cy.get('input[name="number"]').type('4242 4242 4242 4242');
        cy.get('.dropdown[name="expYear"]').click();
        cy.get('.dropdown[name="expYear"] .item').contains('2028').click();
        cy.get('input[name="cvc"]').type('123');
        cy.get('button').click();
        cy.wait(10000);
        cy.get('.modal').contains('Congratulation! You have a premium account');
        cy.get('.modal button').click();
    });

    it('Should unsubsribe user', () => {
        cy.request('GET', '/test/reset');
        cy.request('POST', '/test/users', { users: [{ email: 'contact@ethibox.fr', password: 'myp@ssw0rd', isSubscribed: true }] });
        cy.request('POST', '/test/settings', { settings: [{ name: 'isMonetizationEnabled', value: true }] });

        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/settings', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.get('.checkbox').click();
        cy.get('.modal button.positive').click();
        cy.get('.modal').contains('Unsubscribe successfull');
        cy.get('.modal button').click();
    });

    it('Should disabled subscribe form if monetization is disabled', () => {
        cy.request('GET', '/test/reset');
        cy.request('POST', '/test/users', { users: [{ email: 'contact@ethibox.fr', password: 'myp@ssw0rd', isSubscribed: false }] });
        cy.request('POST', '/test/settings', { settings: [{ name: 'isMonetizationEnabled', value: false }] });

        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/subscribe', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.contains('.form .message.error', 'Monetization is not activated');
    });

    it('Should display error if bad publishable key', () => {
        cy.request('GET', '/test/reset');
        cy.request('POST', '/test/users', { users: [{ email: 'contact@ethibox.fr', password: 'myp@ssw0rd', isSubscribed: false }] });
        cy.request('POST', '/test/settings', { settings: [
            { name: 'isMonetizationEnabled', value: true },
            { name: 'stripePublishableKey', value: 'bad_publishablekey' },
        ] });

        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/subscribe', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.get('.message').contains('Bad stripe publishable key');
    });

    after(() => {
        cy.request('GET', '/test/reset');
    });
});
