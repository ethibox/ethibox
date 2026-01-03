import { TEST_EMAIL, TEST_PASSWORD } from '../../lib/constants';

it('Should login with valid credentials', () => {
    cy.visit('/login');

    cy.get('input[name="email"]').type(TEST_EMAIL);
    cy.get('input[name="password"]').type(TEST_PASSWORD);
    cy.get('button[type="submit"]').click();

    cy.url().should('not.include', '/login');
});

it('Should display error message if login fails', () => {
    cy.visit('/login');

    cy.get('input[name="email"]').type(TEST_EMAIL);
    cy.get('input[name="password"]').type('badpassword');
    cy.get('button[type="submit"]').click();

    cy.get('[data-test=notification]').should('contain', 'Invalid credentials');
});

it('Should redirect to home page if already authenticated', () => {
    cy.task('generate:jwt').then((token) => {
        cy.setCookie('token', token);
        cy.visit('/login');
    });

    cy.url().should('not.include', '/login');
    cy.url().should('include', '/');
});
