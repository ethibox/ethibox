import jwt from 'jsonwebtoken';

const user = { email: 'user@example.com', password: 'myp@ssw0rd' };

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
                        { templateId: 1, userId: user.id, state: 'online' },
                        { templateId: 1, userId: user.id, state: 'online' },
                        { templateId: 1, userId: user.id, state: 'online' },
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
        cy.get('div[aria-modal="true"] button:last').click();
        cy.get('.grid > div').should('have.length', 2);
    });

    it('Should hide deleted applications', () => {
        cy.request('DELETE', 'http://localhost:3000/test/apps/wordpress2');
        cy.visit('/apps');
        cy.get('.grid > div').should('have.length', 1);
    });

    it('Should display label if application is offline', () => {
        cy.request('POST', 'http://localhost:3000/test/apps', { apps: [{ templateId: 1, userId: user.id, state: 'offline' }] });
        cy.visit('/apps');
        cy.get('.grid > div:last-child').should('contain', 'Offline');
    });

    it('Should edit app domain', () => {
        cy.visit('/apps');
        cy.get('.grid > div:first-child button').click({ force: true });
        cy.get('.grid > div:first .origin-top-right button:first').click({ force: true });
        cy.get('div[aria-modal="true"] input').clear().type('test.localhost');
        cy.get('div[aria-modal="true"] button:last').click();
        cy.contains('.notification', 'Configuration edited with success');
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
