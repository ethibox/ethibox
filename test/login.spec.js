import jwt from 'jsonwebtoken';

describe('Login Page', () => {
    before(() => {
        cy.request('POST', 'http://localhost:3000/test/reset');
        cy.request('POST', 'http://localhost:3000/test/users', { users: [{ email: 'user@ethibox.fr', password: 'myp@ssw0rd' }] });
    });

    it('Should not sign in an user with bad logins', () => {
        cy.waitUntil(() => cy.visit('/login'));
        cy.get('input[name="email"]').type('user@ethibox.fr');
        cy.get('input[name="password"]').type('badpassword{enter}');
        cy.get('.error').should('contain', 'Invalid credentials');
        cy.url().should('contain', '/login');
    });

    it('Should sign in', () => {
        cy.waitUntil(() => cy.visit('/login'));
        cy.get('input[name="email"]').type('user@ethibox.fr');
        cy.get('input[name="password"]').type('myp@ssw0rd{enter}');
        cy.url().should('not.contain', '/login');
    });

    it('Should redirect to dashboard if already connect', () => {
        const token = jwt.sign({ id: 1, email: 'user@ethibox.fr' }, 'mys3cr3t', { expiresIn: '1d' });
        cy.waitUntil(() => cy.visit('/login', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } }));
        cy.url().should('not.contain', '/login');
    });
});
