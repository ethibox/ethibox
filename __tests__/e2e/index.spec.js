it('Should redirect to login page if not authenticated', () => {
    cy.visit('/');

    cy.url().should('include', '/login');
});
