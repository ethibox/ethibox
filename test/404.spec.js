describe('404 Page', () => {
    it('Should display 404 message', () => {
        cy.visit('/404');
        cy.get('body').contains('Not found');
    });
});
