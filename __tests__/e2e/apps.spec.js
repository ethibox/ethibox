import { TEST_EMAIL, TEST_PASSWORD } from '../../lib/constants';

before(() => {
    cy.task('stripe:cancel-subscriptions');
});

beforeEach(() => {
    cy.login({ email: TEST_EMAIL, password: TEST_PASSWORD });
    cy.visit('/apps');
    cy.wait(100).clock(new Date().getTime(), ['Date']).tick(500000);
});

it('Should install an application', () => {
    cy.intercept('POST', '/api/apps').as('install');
    cy.intercept('GET', 'https://checkout.stripe.com/**', { body: '' });

    cy.visit('/');
    cy.get('[data-test="app"]:has(img[alt="Kanboard"]) button[type="button"]').click();

    cy.wait('@install').its('response.body.url').then((url) => {
        const [sessionId] = url.match(/cs_test_[^#?/]+/);
        cy.task('stripe:complete-checkout', sessionId);
        cy.visit(`/?session_id=${sessionId}`);
        cy.url({ timeout: 30000 }).should('contain', '/apps');
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
    cy.get('[data-test="app-env-SMTP_PASSWORD"]').clear().type(TEST_PASSWORD);
    cy.get('button[type="submit"]').click();

    cy.get('[data-test="notification"]').should('contain', 'Application updated');
});

it('Should uninstall an application', () => {
    cy.get('[data-test="app-settings"]:first').click();
    cy.get('[data-test="modal-dropdown').click();
    cy.get('[data-test="modal-dropdown-item"]').contains('Uninstall application').click();
    cy.get('[role="dialog"]').should('have.length', 1);
    cy.get('[data-test="uninstall"]').should('be.disabled');
    cy.get('[data-test="uninstall-feedback"]').select('other');
    cy.get('[data-test="uninstall"]').should('be.disabled');
    cy.get('[data-test="uninstall-comment"]').type('Too slow');
    cy.get('[data-test="uninstall"]').click();

    cy.get('[data-test="notification"]').should('contain', 'Application uninstalled');
});
