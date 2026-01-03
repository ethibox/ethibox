import { TEST_EMAIL } from '../../lib/constants';

it('Should show success message with valid email', () => {
    cy.visit('/forgot');

    cy.get('input[name="email"]').type(TEST_EMAIL);
    cy.get('button[type="submit"]').click();

    cy.get('[data-test=notification]').should('contain', 'Success');
});

it('Should show success message even with non-existing email', () => {
    cy.visit('/forgot');

    cy.get('input[name="email"]').type('nonexistent@example.com');
    cy.get('button[type="submit"]').click();

    cy.get('[data-test=notification]').should('contain', 'Success');
});

it('Should require email field', () => {
    cy.visit('/forgot');

    cy.get('button[type="submit"]').click();

    cy.get('input[name="email"]:invalid').should('exist');
});

it('Should require valid email format', () => {
    cy.visit('/forgot');

    cy.get('input[name="email"]').type('invalid-email');
    cy.get('button[type="submit"]').click();

    cy.get('input[name="email"]:invalid').should('exist');
});
