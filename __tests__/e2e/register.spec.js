describe('Given a visitor on the register page', () => {
    beforeEach(() => {
        cy.task('db:reset');
    });

    describe('When he enter a good email and a good password', () => {
        it('Should register the visitor', () => {
            cy.visit('/register');

            cy.get('[data-test="register-email"]').type('contact+test@ethibox.fr');
            cy.get('[data-test="register-password"]').type('myp@ssw0rd');
            cy.get('[data-test="register-button"]').click();

            cy.get('[role=alert]').should('contain', 'You are now registered');
            cy.url().should('contain', '/');
        });
    });

    describe('When he enter a bad email', () => {
        it('Should display an error', () => {
            cy.visit('/register');

            cy.get('[data-test="register-email"]').type('bademail@@example.com');
            cy.get('[data-test="register-password"]').type('myp@ssw0rd');
            cy.get('[data-test="register-button"]').click();

            cy.get('[role=alert]').should('contain', 'Your email is invalid');
            cy.url().should('contain', '/register');
        });
    });

    describe('When he enter an email with a bad MX record', () => {
        it('Should display an error', () => {
            cy.visit('/register');

            cy.get('[data-test="register-email"]').type('bademail@unknown.com');
            cy.get('[data-test="register-password"]').type('myp@ssw0rd');
            cy.get('[data-test="register-button"]').click();

            cy.get('[role=alert]').should('contain', 'Your email is invalid');
            cy.url().should('contain', '/register');
        });
    });

    describe('When he enter an email with a disposable domain', () => {
        it('Should display an error', () => {
            cy.visit('/register');

            cy.get('[data-test="register-email"]').type('user@yopmail.com');
            cy.get('[data-test="register-password"]').type('myp@ssw0rd');
            cy.get('[data-test="register-button"]').click();

            cy.get('[role=alert]').should('contain', 'Your email is not allowed');
            cy.url().should('contain', '/register');
        });
    });

    describe('When he enter an email that already exists', () => {
        it('Should display an error', () => {
            cy.visit('/register');
            cy.task('db:seed');

            cy.get('[data-test="register-email"]').type('contact+test@ethibox.fr');
            cy.get('[data-test="register-password"]').type('myp@ssw0rd');
            cy.get('[data-test="register-button"]').click();

            cy.get('[role=alert]').should('contain', 'A user with that email already exists');
            cy.url().should('contain', '/register');
        });
    });
});
