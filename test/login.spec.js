import jwt from 'jsonwebtoken';

describe('Login Page', () => {
    it('Check title page', () => {
        cy.visit('/');
        cy.title().should('eq', "Ethibox - Let's decentralize the internet!");
    });

    it('Sign in', () => {
        cy.server();
        const token = jwt.sign({ email: 'contact@ethibox.fr' }, 'mysecret', { expiresIn: '1d' });
        cy.route('POST', '**/api/login', { success: true, message: 'Login succeeded', token });

        cy.visit('/login', { onBeforeLoad: (win) => { win.fetch = null; } });
        cy.get('input[name="email"]').type('contact@ethibox.fr');
        cy.get('input[name="password"]').type('myp@ssw0rd{enter}');
        cy.get('.sub.header').contains('Liste des applications');
    });

    it.skip('Logout', () => {
        // @TODO
    });
});
