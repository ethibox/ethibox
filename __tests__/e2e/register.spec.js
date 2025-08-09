const email = `contact+${Date.now()}@ethibox.fr`;

it('Should register with valid credentials', () => {
    cy.visit('/register');

    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type('myp@ssw0rd');
    cy.get('button[type="submit"]').click();

    cy.url().should('not.include', '/register');
});

it('Should show error message for existing email', () => {
    cy.visit('/register');

    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type('myp@ssw0rd');
    cy.get('button[type="submit"]').click();

    cy.get('[data-test=notification]').should('contain', 'A user with that email already exists');
});

it('Should show error message for email with bad MX record', () => {
    cy.visit('/register');

    cy.get('input[name="email"]').type('test@invalid-domain-without-mx.invalid');
    cy.get('input[name="password"]').type('myp@ssw0rd');
    cy.get('button[type="submit"]').click();

    cy.get('[data-test=notification]').should('contain', 'Invalid email address');
});

it('Should show error message for disposable email address', () => {
    cy.visit('/register');

    cy.get('input[name="email"]').type('test@yopmail.com');
    cy.get('input[name="password"]').type('myp@ssw0rd');
    cy.get('button[type="submit"]').click();

    cy.get('[data-test=notification]').should('contain', 'Disposable email addresses are not allowed');
});
