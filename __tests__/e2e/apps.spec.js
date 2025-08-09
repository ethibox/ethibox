beforeEach(() => {
    cy.login({ email: 'contact@ethibox.fr', password: 'myp@ssw0rd' });
    cy.visit('/apps');
    cy.wait(100).clock(new Date().getTime(), ['Date']).tick(500000);
});

it('Should install an application', () => {
    cy.on('uncaught:exception', () => false);
    cy.intercept('POST', 'https://api.stripe.com/v1/payment_pages/*/confirm').as('confirmPayment');
    cy.intercept('GET', 'https://api.stripe.com/v1/elements/sessions*').as('stripeSession');

    cy.visit('/');
    cy.get('[data-test="app"]:has(img[alt="Kanboard"]) button[type="button"]').click();

    cy.wait('@stripeSession');

    cy.origin('https://checkout.stripe.com', () => {
        cy.get('[data-testid="card-accordion-item"]').click();
        cy.get('#cardNumber').type('4242424242424242');
        cy.get('#cardExpiry').type('1234');
        cy.get('#cardCvc').type('424');
        cy.get('#billingName').type('John Doe');
        cy.get('body').then(($body) => {
            if ($body.find('#billingPostalCode').length) {
                cy.get('#billingPostalCode').type('12345');
            }
            if ($body.find('#phoneNumber').length) {
                cy.get('#enableStripePass').click();
            }
        });
        cy.get('.SubmitButton').click();
    });

    cy.wait('@confirmPayment').its('request.url').then((url) => {
        const [, sessionId] = url.match(/payment_pages\/([^/]+)\/confirm/);
        cy.visit(`/?session_id=${sessionId}`);
        cy.url().should('contain', '/apps');
        cy.get('[data-test="app"]').should('exist');
    });
});

it('Should update domain of an application', () => {
    cy.get('[data-test="app-settings"]:first').click();
    cy.get('[data-test="app-domain"]').clear().type(`newdomain-${Date.now()}.localhost`);
    cy.get('button[type="submit"]').click();

    cy.get('[data-test="notification"]').should('contain', 'Application updated');
});

it('Should update SMTP settings of an application', () => {
    cy.get('[data-test="app-settings"]:first').click();
    cy.get('[data-test="app-env-SMTP_HOST"]').clear().type('smtp.example.com');
    cy.get('[data-test="app-env-SMTP_PORT"]').clear().type('587');
    cy.get('[data-test="app-env-SMTP_USERNAME"]').clear().type('user@example.com');
    cy.get('[data-test="app-env-SMTP_PASSWORD"]').clear().type('myp@ssw0rd');
    cy.get('button[type="submit"]').click();

    cy.get('[data-test="notification"]').should('contain', 'Application updated');
});

it('Should uninstall an application', () => {
    cy.get('[data-test="app-settings"]:first').click();
    cy.get('[data-test="modal-dropdown').click();
    cy.get('[data-test="modal-dropdown-item"]').contains('Uninstall application').click();
    cy.get('[data-test="uninstall"]').click();

    cy.get('[data-test="notification"]').should('contain', 'Application uninstalled');
});
