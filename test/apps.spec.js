import jwt from 'jsonwebtoken';

const user = { email: 'user@ethibox.fr', password: 'myp@ssw0rd' };

describe('Applications Page', () => {
    before(() => {
        cy.request('POST', 'http://localhost:3000/test/reset');
        cy.request('POST', 'http://localhost:3000/test/import');
        cy.request('POST', 'http://localhost:3000/test/users', { users: [user] });

        cy.request({
            method: 'POST',
            url: 'http://localhost:3000/graphql',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: `mutation {
                login(email: "${user.email}", password: "${user.password}") { token }
            }` }),
        })
            .its('body')
            .then(({ data }) => {
                user.id = jwt.decode(data.login.token).id;

                cy.request('POST', 'http://localhost:3000/test/apps', {
                    apps: [
                        { templateId: 1, userId: user.id, state: 'running' },
                        { templateId: 1, userId: user.id, state: 'running' },
                        { templateId: 1, userId: user.id, state: 'running' },
                    ],
                });
            });
    });

    beforeEach(() => {
        cy.setLocalStorage('token', jwt.sign(user, 'mys3cr3t', { expiresIn: '1d' }));
    });

    it('Should display applications', () => {
        cy.visit('/apps');
        cy.get('.grid > div').should('have.length', 3);
    });

    it('Should uninstall application', () => {
        cy.visit('/apps');
        cy.get('.grid > div:first-child button:last').click({ force: true });
        cy.get('.grid > div:first-child button:last').click();
        cy.get('#confirm').click();
        cy.get('.grid > div:first-child').should('contain', 'Uninstalling...');
    });

    it('Should hide deleted applications', () => {
        cy.request('DELETE', 'http://localhost:3000/test/apps/wordpress2');
        cy.visit('/apps');
        cy.get('.grid > div').should('have.length', 2);
    });

    it('Should display error if a task failed', () => {
        cy.request('POST', 'http://localhost:3000/test/apps', { apps: [{ templateId: 1, userId: user.id, error: 'Application stuck' }] });
        cy.visit('/apps');
        cy.get('.grid > div:last-child').should('contain', 'Error: Application stuck');
        cy.get('.grid > div:last-child').should('not.contain', 'Installing');
    });

    it.skip('Should display app detail modal', () => {
        cy.request('POST', 'http://localhost:3000/test/apps', { apps: [{ templateId: 2, userId: user.id, state: 'running' }] });
        cy.request('POST', 'http://localhost:3000/test/apps', { apps: [{ templateId: 3, userId: user.id, state: 'running' }] });
        cy.visit('/apps');
        cy.get('.grid > div:first-child button:first').click();
        cy.get('div[role="dialog"]');
    });

    it('Should display progress bar', () => {
        cy.request('POST', 'http://localhost:3000/test/apps', { apps: [{ templateId: 1, userId: user.id }] });
        cy.visit('/apps');
        cy.get('.grid > div:last-child').should('contain', 'Installing');
        cy.get('.grid > div:last-child').should('contain', '10%');
    });

    it.skip('Should display password field', () => {
        cy.request('POST', 'http://localhost:3000/test/reset');
        cy.request('POST', 'http://localhost:3000/test/import');
        cy.request('POST', 'http://localhost:3000/test/users', { users: [{ email: 'user@ethibox.fr', password: 'myp@ssw0rd' }] });
        cy.request('POST', 'http://localhost:3000/test/settings', { settings: [
            { name: 'stripeEnabled', value: 'false' },
        ] });

        cy.visit('/');
        cy.get('.grid > div:nth-child(2) button').click();

        cy.wait(500);
        cy.request('PUT', 'http://localhost:3000/test/apps/flarum1', { state: 'running' });
        cy.wait(500);

        cy.get('.grid > div:first-child button:first').click();
        cy.get('input[type=password] + div button').click();
    });

    it('Should edit app domain', () => {
        cy.visit('/apps');
        cy.get('.grid > div:first-child button').click({ force: true });
        cy.get('.grid > div:first .origin-top-right button:first').click({ force: true });
        cy.get('div[aria-modal="true"] input').clear().type('test.localhost');
        cy.get('div[aria-modal="true"] button:last').click();
        cy.contains('.notification', 'Domain change with success');
    });

    it('Should display error if bad domain', () => {
        cy.visit('/apps');
        cy.get('.grid > div:first-child button').click({ force: true });
        cy.get('.grid > div:first .origin-top-right button:first').click({ force: true });
        cy.get('div[aria-modal="true"] input').clear().type('test.com');
        cy.get('div[aria-modal="true"] button:last').click();
        cy.contains('div[aria-modal="true"]', 'Please setup a correct DNS');
    });
});
