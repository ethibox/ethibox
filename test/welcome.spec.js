describe('My First Test', () => {
    it('Does not do much!', () => {
        expect(true).to.equal(true)
    });

    it('Check title page', () => {
        cy.visit('http://localhost:8080');
        cy.title().should('eq', "Ethibox - Let's decentralize the internet!");
    });
});
