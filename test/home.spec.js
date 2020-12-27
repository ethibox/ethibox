describe('Home Page', () => {
    before(() => {
        cy.request('POST', 'http://localhost:3000/test/reset');
        cy.request('POST', 'http://localhost:3000/test/users', { users: [{ email: 'user@ethibox.fr', password: 'myp@ssw0rd' }] });
    });

    it('Should redirect to login if not connect', () => {
        cy.waitUntil(() => cy.visit('/'));
        cy.url().should('contain', '/login');
    });
});
