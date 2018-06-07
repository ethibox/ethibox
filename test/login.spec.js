import jwt from 'jsonwebtoken';

describe('Login Page', () => {
    before(() => {
        cy.request('GET', '/test/reset');
        cy.request('POST', '/test/users', { users: [{ email: 'contact@ethibox.fr', password: 'myp@ssw0rd' }] });
    });

    it('Should not sign in if bad logins', () => {
        cy.visit('/login', { onBeforeLoad: (win) => { win.fetch = null; } });
        cy.get('input[name="email"]').type('contact@ethibox.fr');
        cy.get('input[name="password"]').type('badpassword{enter}');
        cy.contains('.error', 'Bad logins');
    });

    it('Should sign in', () => {
        cy.visit('/login', { onBeforeLoad: (win) => { win.fetch = null; } });
        cy.get('input[name="email"]').type('contact@ethibox.fr');
        cy.get('input[name="password"]').type('myp@ssw0rd{enter}');
        cy.get('.menu').contains('Logout');
    });

    it('Should not connect user with bad token secret', () => {
        const token = jwt.sign({ userId: 1 }, 'badsecret', { expiresIn: '1d' });
        cy.visit('/', { onBeforeLoad: (win) => { win.fetch = null; win.localStorage.setItem('token', token); } });
        cy.get('.modal').contains('Not authorized');
        cy.get('.modal button').click();
        cy.url().should('contain', '/login');
    });

    it('Should not connect user with bad token', () => {
        const token = 'badtoken';
        cy.visit('/', { onBeforeLoad: (win) => { win.fetch = null; win.localStorage.setItem('token', token); } });
        cy.get('.message').contains('New to us?');
    });

    it('Should disconnect user with expired token', () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: 2 });
        cy.wait(3000);
        cy.visit('/', { onBeforeLoad: (win) => { win.fetch = null; win.localStorage.setItem('token', token); } });
        cy.url().should('contain', '/login');
        cy.get('.message').contains('New to us?');
    });
});
