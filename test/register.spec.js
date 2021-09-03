import jwt from 'jsonwebtoken';

const user = { email: 'user@example.com', password: 'myp@ssw0rd' };

describe('Register Page', () => {
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
            .then(({ data }) => { user.id = jwt.decode(data.login.token).id; });
    });

    it('Should sign up admin user', () => {
        cy.visit('/register');
        cy.get('input[name="email"]').type('admin@example.com');
        cy.get('input[name="password"]').type('myp@ssw0rd{enter}');
        cy.url().should('not.contain', '/register');
    });

    it('Should sign up user', () => {
        cy.visit('/register');
        cy.get('input[name="email"]').type('user2@example.com');
        cy.get('input[name="password"]').type('myp@ssw0rd{enter}');
        cy.url().should('not.contain', '/register');
    });

    it('Should not sign up if user already exist', () => {
        cy.visit('/register');
        cy.get('input[name="email"]').type('user@example.com');
        cy.get('input[name="password"]').type('myp@ssw0rd{enter}');
        cy.get('.error').should('contain', 'User already exist');
        cy.url().should('contain', '/register');
    });

    it('Should redirect to dashboard if already connect', () => {
        cy.setLocalStorage('token', jwt.sign(user, 'mys3cr3t', { expiresIn: '1d' }));
        cy.visit('/register');
        cy.url().should('not.contain', '/register');
    });
});
