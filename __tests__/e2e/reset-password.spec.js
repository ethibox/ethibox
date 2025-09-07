it('Should reset password with valid token and matching passwords', () => {
    cy.task('generate:jwt').then((token) => {
        cy.visit(`/reset-password?token=${token}`);
    });

    cy.get('input[name="password"]').type('newp@ssw0rd');
    cy.get('input[name="confirmPassword"]').type('newp@ssw0rd');
    cy.get('button[type="submit"]').click();

    cy.get('[data-test=notification]').should('contain', 'Success');

    cy.url().should('include', '/login');
});

it('Should show error message when passwords do not match', () => {
    cy.task('generate:jwt').then((token) => {
        cy.visit(`/reset-password?token=${token}`);
    });

    cy.get('input[name="password"]').type('newp@ssw0rd');
    cy.get('input[name="confirmPassword"]').type('differentp@ssw0rd');
    cy.get('button[type="submit"]').click();

    cy.get('[data-test=notification]').should('contain', 'Passwords do not match');

    cy.url().should('include', '/reset-password');
});

it('Should show error message with expired or invalid token', () => {
    cy.visit('/reset-password?token=expired-reset-token');

    cy.get('input[name="password"]').type('newp@ssw0rd');
    cy.get('input[name="confirmPassword"]').type('newp@ssw0rd');
    cy.get('button[type="submit"]').click();

    cy.get('[data-test=notification]').should('contain', 'Invalid or expired token');
});

it('Should redirect to home page when no token is provided', () => {
    cy.visit('/reset-password');

    cy.url().should('not.include', '/reset-password');
    cy.url().should('include', '/');
});

after(() => {
    cy.resetPassword();
});
