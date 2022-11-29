import jwt from 'jsonwebtoken';

describe('Given a user on the apps page', () => {
    beforeEach(() => {
        cy.task('db:reset');
        cy.task('db:seed');

        const user = { email: 'contact+test@ethibox.fr' };
        const token = jwt.sign(user, Cypress.env('JWT_SECRET'), { expiresIn: '1d' });

        cy.session(user, () => {
            window.localStorage.setItem('token', token);
        });
    });

    describe('When he edit an app domain', () => {
        it('Should edit the app domain', () => {
            cy.visit('/apps');

            cy.get('[data-test="app-settings"]:first').click();
            cy.get('[data-test="app-domain"]').clear().type('newdomain.localhost');
            cy.get('[data-test="save-app-settings"]').click();

            cy.get('[role=alert]').should('contain', 'Settings saved successfully');
            cy.get('[data-test="app"]:first').should('contain', 'newdomain.localhost');
        });
    });

    describe('When he edit an app SMTP configuration', () => {
        it('Should edit the app SMTP configuration', () => {
            cy.visit('/apps');

            cy.get('[data-test="app-settings"]').eq(1).click();
            cy.get('[data-test="app-env-smtp_hostname"]').clear().type('smtp.example.com');
            cy.get('[data-test="app-env-smtp_username"]').clear().type('contact+test@ethibox.fr');
            cy.get('[data-test="app-env-smtp_password"]').clear().type('myp@ssw0rd');
            cy.get('[data-test="app-env-smtp_from"]').clear().type('contact+test@ethibox.fr');
            cy.get('[data-test="app-env-smtp_port"]').clear().type('587');
            cy.get('[data-test="app-env-smtp_tls"]').select('true');
            cy.get('[data-test="save-app-settings"]').click();

            cy.get('[role=alert]').should('contain', 'Settings saved successfully');
        });
    });

    describe('When he uninstall an app', () => {
        it('Should uninstall the app', () => {
            cy.visit('/apps');

            cy.get('[data-test="app-settings"]:first').click();
            cy.get('[data-test="settings-dropdown"]').click();
            cy.get('[data-test="uninstall-app"]').click();
            cy.get('[data-test="confirm-uninstall-app"]').click();

            cy.get('[role=alert]').should('contain', 'App uninstalled');
        });
    });
});
