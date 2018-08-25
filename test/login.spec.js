import jwt from 'jsonwebtoken';

describe('Login Page', () => {
    before(() => {
        cy.request('GET', '/test/reset');
        cy.request('POST', '/test/users', { users: [{ email: 'contact@ethibox.fr', password: 'myp@ssw0rd' }] });
    });

    it('Should not sign in an user with bad logins', () => {
        cy.visit('/login');
        cy.get('input[name="email"]').type('contact@ethibox.fr');
        cy.get('input[name="password"]').type('badpassword{enter}');
        cy.contains('.error', 'Bad logins');
    });

    it('Should sign in', () => {
        cy.visit('/login');
        cy.get('input[name="email"]').type('contact@ethibox.fr');
        cy.get('input[name="password"]').type('myp@ssw0rd{enter}');
        cy.contains('.menu', 'Logout');
    });

    it('Should not sign in an user with bad secret token', () => {
        const token = jwt.sign({ userId: 1 }, 'badsecret', { expiresIn: '1d' });
        cy.visit('/', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.contains('.ui-alerts', 'Not authorized!');
        cy.url().should('contain', '/login');
    });

    it('Should not sign in an user with bad token', () => {
        const token = 'badtoken';
        cy.visit('/', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.contains('.message', 'New to us?');
    });
});
