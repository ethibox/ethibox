describe('Given a user on the invoices page', () => {
    beforeEach(() => {
        cy.task('db:reset');
        cy.task('db:seed');
    });

    describe.skip('When he access the invoices page', () => {
        it('Should display the invoices', () => {
            cy.visit('/invoices');

            cy.get('[data-test="invoice"]').should('have.length', 3);
        });
    });
});
