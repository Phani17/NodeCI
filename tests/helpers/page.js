const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');

class CustomPage {
  constructor(page){
    this.page = page;
  }
  static async build() {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    //--no-sandbox : it helps us from having to kind of tinker around
    // with some of settings of virtual machine that we're
    //going to be assigned by travis.
    // bu turning it on, no sandbox flag here, its going to dramatically
    //decrase time it takes for our test to run
    const page = await browser.newPage();
    const customPage = new CustomPage(page);
    return new Proxy(customPage, {
      get: function(target, property){
        return customPage[property] || browser[property] || page[property]
      }
    });
  }
  async login() {
    const user = await userFactory();
    const { session, sig } =sessionFactory(user);
    await this.page.setCookie({ name: 'session', value: session });
    await this.page.setCookie({ name: 'session.sig', value: sig });
    await this.page.goto('http://localhost:3000/blogs');
    await this.page.waitFor('a[href="/auth/logout"]');
  }
  async getContentsOf(selector){
    return this.page.$eval(selector, el => el.innerHTML);
  }
  get(path){
    return this.page.evaluate((_path) => {
        return fetch(_path, {
          method: 'GET',
          credentials: 'same-origin',
          headers: {
            'Content-Type' : 'application/json'
          }
        }).then(res => res.json());
    }, path);
  }

}

module.exports = CustomPage;
