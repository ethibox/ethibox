describe('my tests', () => {
    it('welcome', async () => {
        await browser.url('http://0.0.0.0:8081');

        const title = await browser.getTitle();
        assert.equal(title, 'Ethibox');
    });
});
