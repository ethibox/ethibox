import 'cypress-wait-until';
import 'cypress-localstorage-commands';
import 'cypress-file-upload';

Cypress.Commands.add('iframeLoaded', { prevSubject: 'element' }, ($iframe) => {
    const contentWindow = $iframe.prop('contentWindow');

    return new Promise((resolve) => {
        if (contentWindow && contentWindow.document.readyState === 'complete') {
            resolve(contentWindow);
        } else {
            $iframe.on('load', () => {
                resolve(contentWindow);
            });
        }
    });
});

Cypress.Commands.add('getInDocument', { prevSubject: 'document' }, (document, selector) => Cypress.$(selector, document));

Cypress.Commands.add('getWithinIframe', (targetElement) => cy.get('iframe').iframeLoaded().its('document').getInDocument(targetElement));
