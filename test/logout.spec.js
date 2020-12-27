import jwt from 'jsonwebtoken';

const user = { email: 'user@ethibox.fr', password: 'myp@ssw0rd' };

describe('Logout Page', () => {
    before(() => {
        cy.request('POST', 'http://localhost:3000/test/reset');
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
                const { token } = data.login;
                const { id } = jwt.decode(token);
                user.id = id;
            });
    });

    it('Should logout', () => {
        cy.setLocalStorage('token', jwt.sign(user, 'mys3cr3t', { expiresIn: '1d' }));
        cy.visit('/');
        cy.get('#user-menu').click();
        cy.get('a[href="/logout"]').click();
        cy.url().should('contain', '/login');
    });

    it('Should logout user when expired session and display message', () => {
        cy.setLocalStorage('token', jwt.sign(user, 'mys3cr3t', { expiresIn: '5s' }));
        cy.visit('/');
        cy.get('div[role=menu]').contains('Sign out');
        cy.wait(5000);
        cy.visit('/');
        cy.url().should('contain', '/login');
        cy.get('.error').should('contain', 'Your session has expired');
    });

    it('Should redirect to login page if not connected', () => {
        cy.visit('/');
        cy.url().should('contain', '/login');
    });

    it('Should redirect a non-existing user to login page', () => {
        cy.setLocalStorage('token', jwt.sign({ id: 2, email: 'user2@ethibox.fr' }, 'mys3cr3t', { expiresIn: '1d' }));
        cy.on('uncaught:exception', () => false);
        cy.visit('/');
        cy.url().should('contain', '/login');
    });
});
