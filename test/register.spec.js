import jwt from 'jsonwebtoken';

describe('Register Page', () => {
    it('Should sign up', () => {
        cy.server();
        const token = jwt.sign({ email: 'contact@ethibox.fr' }, 'mysecret', { expiresIn: '1d' });
        cy.route('POST', '**/api/register', { success: true, message: 'Register succeeded', token });
        cy.route('POST', '**/api/graphql', { data: { packages: [{ name: 'etherpad', category: 'Editor' }, { name: 'owncloud', category: 'Storage' }] } });

        cy.visit('/register', { onBeforeLoad: (win) => { win.fetch = null; } });
        cy.get('input[name="email"]').type('contact@ethibox.fr');
        cy.get('input[name="password"]').type('myp@ssw0rd{enter}');
        cy.visit('/', { onBeforeLoad: (win) => { win.fetch = null; } });
        cy.get('.sub.header').contains('Liste des applications');
        cy.get('.dimmer').should('not.have.class', 'active');
    });
});
