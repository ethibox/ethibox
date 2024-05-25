import jwt from 'jsonwebtoken';

describe('Given a user on the home page', () => {
    beforeEach(() => {
        cy.task('stripe:reset');
        cy.task('db:reset');
        cy.task('db:seed');

        const user = { email: 'contact+test@ethibox.fr' };
        const token = jwt.sign(user, Cypress.env('JWT_SECRET'), { expiresIn: '1d' });

        cy.session(user, () => {
            window.localStorage.setItem('token', token);
        });
    });

    describe('When he install an app', () => {
        it('Should install the app', () => {
            let stripeCheckoutUrl = '';
            cy.on('uncaught:exception', () => false);
            cy.intercept('POST', '/api/stripe', (req) => {
                req.continue((res) => {
                    stripeCheckoutUrl = res.body.url;
                });
            }).as('getStripe');

            cy.visit('/');
            cy.wait(1000);
            cy.get('[data-test="install-app"]:first').click();
            cy.wait('@getStripe').then(() => {
                cy.visit(stripeCheckoutUrl);
                cy.get('#cardNumber').type('4242424242424242');
                cy.get('#cardExpiry').type('1234');
                cy.get('#cardCvc').type('424');
                cy.get('#billingName').type('John Doe');
                if (Cypress.env('CI') === 'true') {
                    cy.get('#billingPostalCode').type('12345');
                }
                cy.get('.SubmitButton').click();

                cy.url().should('contain', '/apps');
                cy.get('[data-test="app"]').should('have.length', 3);
            });
        });
    });
});

describe('Given a visitor on the home page', () => {
    describe('When he visit the home page', () => {
        it('Should redirect to login', () => {
            cy.visit('/');

            cy.url().should('contain', '/login');
        });
    });
});
