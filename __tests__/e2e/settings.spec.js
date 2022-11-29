import jwt from 'jsonwebtoken';

describe('Given a user on the settings page', () => {
    beforeEach(() => {
        const user = { email: 'contact+test@ethibox.fr' };
        const token = jwt.sign(user, Cypress.env('JWT_SECRET'), { expiresIn: '1d' });

        cy.task('db:reset');
        cy.task('db:seed');

        cy.session(user, () => {
            window.localStorage.setItem('token', token);
        });
    });

    describe('When he add a payment method', () => {
        it('Should add the payment method', () => {
            cy.visit('/settings');

            cy.get('[data-test="add-payment-method"]').click();

            cy.url().should('contain', 'billing.stripe.com');
        });
    });

    describe('When he change his first and last name', () => {
        it('Should change the first and last name', () => {
            cy.visit('/settings');

            cy.get('[data-test="first-name"]').clear().type('John');
            cy.get('[data-test="last-name"]').clear().type('Doe');

            cy.get('[data-test="save"]').click();

            cy.get('[role=alert]').should('contain', 'Your data has been saved');
        });
    });

    describe('When he click on the "detete account" button', () => {
        it('Should delete the account', () => {
            cy.visit('/settings');

            cy.get('[data-test="delete-account"]').click();
            cy.get('[data-test="confirm-delete-account"]').click();

            cy.get('[role=alert]').should('contain', 'Your account has been deleted');
            cy.visit('/login');
        });
    });
});
