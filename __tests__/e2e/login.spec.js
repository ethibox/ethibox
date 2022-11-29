import jwt from 'jsonwebtoken';

describe('Given a visitor on the login page', () => {
    before(() => {
        cy.task('db:reset');
        cy.task('db:seed');
    });

    describe('When he enter a good email and a good password', () => {
        it('Should log the visitor in', () => {
            cy.visit('/login');

            cy.get('[data-test="login-email"]').type('contact+test@ethibox.fr');
            cy.get('[data-test="login-password"]').type('myp@ssw0rd');
            cy.get('[data-test="login-button"]').click();

            cy.get('[role=alert]').should('contain', 'You are now logged in');
            cy.url().should('contain', '/');
        });
    });

    describe('When he enter a bad password', () => {
        it('Should display an error', () => {
            cy.visit('/login');

            cy.get('[data-test="login-email"]').type('contact+test@ethibox.fr');
            cy.get('[data-test="login-password"]').type('badpassword');
            cy.get('[data-test="login-button"]').click();

            cy.get('[role=alert]').should('contain', 'Invalid credentials');
            cy.url().should('contain', '/login');
        });
    });

    describe('When he enter a bad email', () => {
        it('Should display an error', () => {
            cy.visit('/login');

            cy.get('[data-test="login-email"]').type('bademail@@example.com');
            cy.get('[data-test="login-password"]').type('password');
            cy.get('[data-test="login-button"]').click();

            cy.get('[role=alert]').should('contain', 'Invalid email');
            cy.url().should('contain', '/login');
        });
    });
});

describe('Given a user on the login page', () => {
    describe('When he visit the login page', () => {
        it('Should redirect to home', () => {
            const user = { email: 'contact+test@ethibox.fr' };
            const token = jwt.sign(user, Cypress.env('JWT_SECRET'), { expiresIn: '1d' });
            cy.session(user, () => {
                window.localStorage.setItem('token', token);
            });

            cy.visit('/login');

            cy.get('[role=alert]').should('contain', 'You are already logged in');
            cy.url().should('not.contain', '/login');
        });
    });
});
