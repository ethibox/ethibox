it('Should redirect to login page when visiting logout', () => {
    cy.visit('/logout');

    cy.url().should('include', '/login');
});

it('Should show redirection message briefly', () => {
    cy.visit('/logout');

    cy.get('[data-test="loading"]').should('contain', 'Logout...');
});

it('Should logout authenticated user', () => {
    cy.task('generate:jwt').then((token) => {
        cy.setCookie('token', token);
        cy.visit('/apps');
    });

    cy.url().should('not.include', '/login');

    cy.visit('/logout');

    cy.url().should('include', '/login');

    cy.visit('/apps');
    cy.url().should('include', '/login');
});

it.skip('Should automatically logout deleted user', () => {
    cy.task('db:reset');
    cy.task('generate:jwt').then((token) => {
        cy.setCookie('token', token);
        cy.visit('/apps');
    });

    cy.url().should('not.include', '/login');
    cy.url().should('include', '/apps');

    cy.getCookie('token').should('exist');

    cy.task('user:delete');

    cy.visit('/apps');

    cy.url().should('include', '/login');
});
