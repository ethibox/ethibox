import jwt from 'jsonwebtoken';

describe('Store Page', () => {
    before(() => {
        cy.request('GET', '/test/reset');
        cy.request('POST', '/test/users', { users: [{ email: 'contact@ethibox.fr', password: 'myp@ssw0rd' }] });
        cy.request('POST', '/test/packages', { packages: [{ name: 'etherpad', category: 'Editor' }, { name: 'owncloud', category: 'Storage' }] });
    });

    it('Should display packages after connect', () => {
        cy.visit('/login', { onBeforeLoad: (win) => { win.fetch = null; } });
        cy.get('input[name="email"]').type('contact@ethibox.fr');
        cy.get('input[name="password"]').type('myp@ssw0rd{enter}');
        cy.get('.item[href="/store"]').click({ force: true });
        cy.get('.cards .card:last-child .header').contains('owncloud');
    });

    it('Should install an application', () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/store', { onBeforeLoad: (win) => { win.fetch = null; win.localStorage.setItem('token', token); } });
        cy.get('.cards .card:first-child .buttons').click();
        cy.get('.cards .card:first-child input').type('myapp{enter}');
        cy.get('.cards .card:first-child .header').contains('myapp');
    });

    it('Should display an error if application has a bad name', () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/store', { onBeforeLoad: (win) => { win.fetch = null; win.localStorage.setItem('token', token); } });
        cy.get('.cards .card:last-child .buttons').click();
        cy.get('.cards .card:last-child input').type('Bad.Name{enter}');
        cy.get('.cards .card:last-child').contains('Please enter a valid name');
    });

    it('Should display an error if duplicate name application', () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/store', { onBeforeLoad: (win) => { win.fetch = null; win.localStorage.setItem('token', token); } });
        cy.get('.cards .card:last-child .buttons').click();
        cy.get('.cards .card:last-child input').type('myapp{enter}');
        cy.get('.cards .card:last-child').contains('Application\'s name already taken');
    });
});
