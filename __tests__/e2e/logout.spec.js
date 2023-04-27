import jwt from 'jsonwebtoken';

describe('Given a connected user', () => {
    beforeEach(() => {
        const user = { email: 'contact+test@ethibox.fr' };
        const token = jwt.sign(user, Cypress.env('JWT_SECRET'), { expiresIn: '1d' });

        cy.session(user, () => {
            window.localStorage.setItem('token', token);
        });
    });

    describe('When he click on the logout button', () => {
        it('Should log the user out', () => {
            cy.visit('/');

            cy.get('[data-test="logout"]').click();

            cy.get('[role=alert]').should('contain', 'You have been logged out');
            cy.visit('/login');
        });
    });

    describe.skip('When a user has been deleted', () => {
        it('Should log the user out', () => {
            cy.task('db:reset');

            cy.visit('/');

            cy.url().should('contain', '/login');
        });
    });
});
