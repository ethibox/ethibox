import jwt from 'jsonwebtoken';

describe('Register Page', () => {
    it('Sign up', () => {
        cy.server();
        const token = jwt.sign({ email: 'contact@ethibox.fr' }, 'mysecret', { expiresIn: '1d' });
        cy.route('POST', '**/api/register', { success: true, message: 'Register succeeded', token });

        cy.visit('/register', { onBeforeLoad: (win) => { win.fetch = null; } });
        cy.get('input[name="email"]').type('contact@ethibox.fr');
        cy.get('input[name="password"]').type('myp@ssw0rd{enter}');
        cy.get('.sub.header').contains('Liste des applications');
    });
});
