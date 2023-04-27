import jwt from 'jsonwebtoken';

describe('Given a visitor on the forgot password page', () => {
    describe('When he enter a good email', () => {
        it('Should send a reset password email', () => {
            cy.visit('/forgot');

            cy.get('[data-test="forgot-email"]').type('contact+test@ethibox.fr');
            cy.get('[data-test="forgot-button"]').click();

            cy.get('[role=alert]').should('contain', "If your email address is associated with an account. You'll receive an email shortly");
        });
    });

    describe('When he enter a bad email', () => {
        it('Should display an error', () => {
            cy.visit('/forgot');

            cy.get('[data-test="forgot-email"]').type('bademail@@example.com');
            cy.get('[data-test="forgot-button"]').click();

            cy.get('[role=alert]').should('contain', 'Please enter a valid email');
        });
    });

    describe('When a good token is provided', () => {
        it('Should display a reset password form', () => {
            cy.visit('/forgot?token=goodtoken');

            cy.get('[data-test="password"]').should('be.visible');
            cy.get('[data-test="confirm-password"]').should('be.visible');
        });

        it('Should update the password', () => {
            const token = jwt.sign({ email: 'contact+test@ethibox.fr' }, Cypress.env('JWT_SECRET'), { expiresIn: '1h' });
            cy.visit(`/forgot?token=${token}`);

            cy.get('[data-test="password"]').type('mynewp@ssw0rd');
            cy.get('[data-test="confirm-password"]').type('mynewp@ssw0rd');
            cy.get('[data-test="reset-button"]').click();

            cy.get('[role=alert]').should('contain', 'Password updated');
        });

        it('Should display an error if passwords do not match', () => {
            cy.visit('/forgot?token=goodtoken');

            cy.get('[data-test="password"]').type('newpassword');
            cy.get('[data-test="confirm-password"]').type('badpassword');
            cy.get('[data-test="reset-button"]').click();

            cy.get('[role=alert]').should('contain', 'Passwords do not match');
        });
    });
});
