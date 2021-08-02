import jwt from 'jsonwebtoken';

const user = { email: 'user@example.com', password: 'myp@ssw0rd' };

describe('Forgot Page', () => {
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

    it('Should display error if bad e-mail address', () => {
        cy.visit('/reset');
        cy.get('input[name="email"]').type('bademail{enter}');
        cy.get('.error').should('contain', 'Please enter your e-mail');
    });

    it('Should display success message if good e-mail address', () => {
        cy.visit('/reset');
        cy.get('input[name="email"]').type('user@example.com{enter}');
        cy.get('.success').should('contain', 'Check your inbox');
    });

    it('Should redirect to login page if no token', () => {
        cy.visit('/resetpassword');
        cy.url().should('not.contain', '/resetpassword');
        cy.url().should('contain', '/login');
    });

    it('Should display error message if bad new password enter', () => {
        const token = jwt.sign(user, 'mys3cr3t', { expiresIn: '10m' });
        cy.visit(`/resetpassword?token=${token}`);
        cy.get('input[name="password"]').type('bad{enter}');
        cy.get('.error').should('contain', 'Your password must be at least 6 characters');
    });

    it('Should display success message if good new password enter', () => {
        const token = jwt.sign(user, 'mys3cr3t', { expiresIn: '10m' });
        cy.visit(`/resetpassword?token=${token}`);
        cy.get('input[name="password"]').type('goodpassword{enter}');
        cy.get('.success').should('contain', 'Password changed successfully');
    });
});
