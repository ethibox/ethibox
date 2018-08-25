describe('Register Page', () => {
    before(() => {
        cy.request('GET', '/test/reset');
    });

    it('Should register the first account as admin', () => {
        cy.visit('/register');
        cy.get('input[name="email"]').type('admin@ethibox.fr');
        cy.get('input[name="password"]').type('myp@ssw0rd{enter}');
        cy.request('GET', '/test/users').then((response) => {
            expect(response.body[0]).to.have.property('isAdmin', true);
        });
    });

    it('Should sign up', () => {
        cy.visit('/register');
        cy.get('input[name="email"]').type('contact@ethibox.fr');
        cy.get('input[name="password"]').type('myp@ssw0rd{enter}');
        cy.get('.menu').contains('Logout');
        cy.get('.dimmer').should('not.have.class', 'active');
        cy.request('GET', '/test/users').then((response) => {
            expect(response.body[1]).to.have.property('isAdmin', false);
        });
    });

    it('Should not sign up if user exist', () => {
        cy.visit('/register');
        cy.get('input[name="email"]').type('contact@ethibox.fr');
        cy.get('input[name="password"]').type('myp@ssw0rd{enter}');
        cy.contains('.error', 'User already exist');
    });
});
