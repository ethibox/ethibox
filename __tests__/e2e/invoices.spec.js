import { TEST_EMAIL, TEST_PASSWORD } from '../../lib/constants';

beforeEach(() => {
    cy.login({ email: TEST_EMAIL, password: TEST_PASSWORD });
    cy.visit('/invoices');
});

it('Should display loading state when invoices are being fetched', () => {
    cy.intercept('GET', '/api/invoices', { delay: 1000, body: [] }).as('getInvoices');

    cy.contains('Loading...').should('be.visible');
    cy.wait('@getInvoices');
});

it('Should display empty state when no invoices exist', () => {
    cy.intercept('GET', '/api/invoices', { body: [] }).as('getInvoices');

    cy.wait('@getInvoices');
    cy.contains('No invoices').should('be.visible');
    cy.contains('You have no invoices yet').should('be.visible');
    cy.get('a').contains('Go to the store').should('be.visible');
});

it('Should display invoices table when invoices exist', () => {
    cy.intercept('GET', '/api/invoices', { body: [
        {
            id: 1,
            number: '2024001',
            date: '2024-01-15T10:30:00Z',
            description: 'Monthly subscription - January 2024',
            total: 19,
            currency: 'EUR',
            status: 'paid',
            url: 'https://example.com/invoice/2024001.pdf',
        },
        {
            id: 2,
            number: '2024002',
            date: '2024-02-15T10:30:00Z',
            description: 'Monthly subscription - February 2024',
            total: 19,
            currency: 'EUR',
            status: 'paid',
            url: 'https://example.com/invoice/2024002.pdf',
        },
    ] }).as('getInvoices');

    cy.wait('@getInvoices');

    cy.contains('h1', 'Invoices').should('be.visible');
    cy.contains('h2', 'A list of all your invoices').should('be.visible');

    cy.contains('th', 'Number').should('be.visible');
    cy.contains('th', 'Date').should('be.visible');
    cy.contains('th', 'Description').should('be.visible');
    cy.contains('th', 'Total').should('be.visible');
    cy.contains('th', 'Status').should('be.visible');

    cy.contains('#2024001').should('be.visible');
    cy.contains('Monthly subscription - January 2024').should('be.visible');
    cy.contains('€19').should('be.visible');
    cy.contains('span', 'Paid').should('have.class', 'bg-green-100');

    cy.contains('#2024002').should('be.visible');
    cy.contains('Monthly subscription - February 2024').should('be.visible');
});

it('Should open invoice PDF when view link is clicked', () => {
    cy.intercept('GET', '/api/invoices', { body: [{
        id: 1,
        number: '2024001',
        date: '2024-01-15T10:30:00Z',
        description: 'Monthly subscription - January 2024',
        total: 2999,
        currency: 'EUR',
        status: 'paid',
        url: 'https://example.com/invoice/2024001.pdf',
    }] }).as('getInvoices');

    cy.wait('@getInvoices');

    cy.get('a[href="https://example.com/invoice/2024001.pdf"]')
        .should('have.attr', 'target', '_blank')
        .contains('View')
        .should('be.visible');
});

it('Should handle API error gracefully', () => {
    cy.intercept('GET', '/api/invoices', { statusCode: 500 }).as('getInvoicesError');

    cy.wait('@getInvoicesError');

    cy.get('[data-test=notification]').should('contain', 'Failed to load invoices');
});

it('Should redirect to login if not authenticated', () => {
    cy.clearCookies();

    cy.url({ timeout: 10000 }).should('include', '/login');
});
