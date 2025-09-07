Cypress.Commands.add('login', ({ email, password }) => {
    cy.session(email, () => {
        cy.visit('/login');
        cy.get('input[name=email]').type(email);
        cy.get('input[name=password]').type(password);
        cy.get('button[type="submit"]').click();
        cy.get('a').contains('Home');
    }, {
        validate: () => {
            cy.getCookie('token', { timeout: 10000 }).should('exist');
        },
    });
});

Cypress.Commands.add('register', ({ email, password }) => {
    cy.request({
        method: 'POST',
        url: '/api/register',
        body: { email, password },
        failOnStatusCode: false,
    });
});

Cypress.Commands.add('resetPassword', () => {
    cy.task('generate:jwt').then((token) => {
        cy.request({
            method: 'POST',
            url: '/api/reset-password',
            body: { token, password: 'myp@ssw0rd' },
        });
    });
});

before(() => {
    cy.register({ email: 'contact@ethibox.fr', password: 'myp@ssw0rd' });
});
