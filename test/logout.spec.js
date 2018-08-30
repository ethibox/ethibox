import jwt from 'jsonwebtoken';

describe('Logout', () => {
    before(() => {
        cy.request('POST', '/test/reset');
        cy.request('POST', '/test/users', { users: [{ email: 'contact@ethibox.fr', password: 'myp@ssw0rd' }] });
    });

    it('Should logout', () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.get('.sidebar a:last-child').click({ force: true });
        cy.get('.message').contains('New to us?');
    });

    it('Should logout user when expired session and display message', () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: 5 });
        cy.visit('/', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.get('.menu').contains('Logout');
        cy.wait(3000);
        cy.url().should('contain', '/login');
        cy.get('.message').contains('New to us?');
        cy.contains('.ui-alerts', 'Your Session has expired!');
    });

    it('Should logout an unauthorized user', () => {
        const token = jwt.sign({ userId: 2 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/store', { onBeforeLoad: (win) => { win.localStorage.setItem('token', token); } });
        cy.url().should('contain', '/login');
        cy.get('.message').contains('New to us?');
        cy.contains('.ui-alerts', 'Not authorized!');
    });

    it.skip('Should logout when unauthorized action and display message', () => {
        // TODO
    });
});
