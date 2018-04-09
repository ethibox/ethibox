import jwt from 'jsonwebtoken';

describe('Logout', () => {
    it('Should logout', () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/', { onBeforeLoad: (win) => { win.fetch = null; win.localStorage.setItem('token', token); } });
        cy.get('.sidebar a:last-child').click({ force: true });
        cy.get('.message').contains('New to us?');
    });
});
