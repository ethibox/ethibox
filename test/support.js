Cypress.on('window:before:load', (win) => {
    win.fetch = null;
});
