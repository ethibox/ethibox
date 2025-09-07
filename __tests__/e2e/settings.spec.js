before(() => {
    cy.register({ email: 'contact+2@ethibox.fr', password: 'myp@ssw0rd' });
});

beforeEach(() => {
    cy.login({ email: 'contact+2@ethibox.fr', password: 'myp@ssw0rd' });
    cy.visit('/settings');
});

it('Should edit settings', () => {
    cy.get('input[name="firstName"]').clear().type('John');
    cy.get('input[name="lastName"]').clear().type('Doe');
    cy.contains('button', 'Save').click();

    cy.get('[data-test=notification]').should('contain', 'Settings saved');
});

it('Should change language', () => {
    cy.get('select[name="language"]').select('fr');
    cy.contains('button', 'Save').click();

    cy.get('[data-test=notification]', { timeout: 10000 }).should('contain', 'Paramètres enregistrés');
    cy.url().should('include', '/fr/');
});

it('Should delete account', () => {
    cy.contains('button', 'Delete my account').click();

    cy.get('[role="dialog"]').should('be.visible');
    cy.get('[role="dialog"]').within(() => {
        cy.contains('button', 'Delete my account').click();
    });

    cy.url().should('include', '/logout');
});
