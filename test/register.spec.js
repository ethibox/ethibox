describe('Register Page', () => {
    before(() => {
        cy.request('GET', '/test/reset');
    });

    it('Should sign up', () => {
        cy.visit('/register', { onBeforeLoad: (win) => { win.fetch = null; } });
        cy.get('input[name="email"]').type('contact@ethibox.fr');
        cy.get('input[name="password"]').type('myp@ssw0rd{enter}');
        cy.get('.menu').contains('Logout');
        cy.get('.dimmer').should('not.have.class', 'active');
    });

    it('Should not sign up if user exist', () => {
        cy.visit('/register', { onBeforeLoad: (win) => { win.fetch = null; } });
        cy.get('input[name="email"]').type('contact@ethibox.fr');
        cy.get('input[name="password"]').type('myp@ssw0rd{enter}');
        cy.contains('.error', 'User already exist');
    });
});
