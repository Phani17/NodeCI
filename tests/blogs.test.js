const Page = require('./helpers/page');
let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto('http://localhost:3000');
  
});

afterEach(async () => {
  await page.close();
});

describe('When Logged in', async () => {
    beforeEach(async () => {
      await page.login();
      await page.click('a.btn-floating');
    });
    test('can see blog create form',async () => {
      const label = await page.getContentsOf('form label');
      expect(label).toEqual('Blog Title');
    });
    describe('And using valid inputs', async () => {
      beforeEach(async () => {
        await page.type('.title input', 'My Title');
        await page.type('.content input', 'My Content');
        await page.click('form button');
      });
      test('Submitting takes user to review screen', async () => {
        const text = await page.getContentsOf('h5');
        expect(text).toEqual('Please confirm your entries');
      });
      test('Submitting takes user to review screen', async () => {
        await page.click('button.green');
        await page.waitFor('.card');
        const title = await page.getContentsOf('.card-title');
        const content = await page.getContentsOf('p');
        expect(title).toEqual('My Title');
        expect(content).toEqual('My Content');
      });
    });
    describe('And using invalid inputs', async () => {
      beforeEach(async () => {
        await page.click('form button');
      });
      test('form shows an error message', async () => {
        const titleError = await page.getContentsOf('.title .red-text');
        const contentError = await page.getContentsOf('.content .red-text');
        expect(titleError).toEqual('You must provide a value');
        expect(contentError).toEqual('You must provide a value');
      });
    });
});


describe('User is ot logged in', async () => {
  test('User cannot create blog posts', async () => {
    const result = await page.evaluate(
      () => {
        return fetch('/api/blogs', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type' : 'application/json'
          },
          body: JSON.stringify({ title: 'My Title', content: 'My Content new' })
        }).then(res => res.json());
      }
    );
    expect(result).toEqual({ error: 'You must log in!' });
  });

  test('User cannot get list of blog posts', async () => {
    const result = await page.get('/api/blogs');
    expect(result).toEqual({ error: 'You must log in!' });
  });
});
