import {classNames, select, settings} from './settings.js';

import Home from './components/Home.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';
import Booking from './components/Booking.js';

const app = {

  initPages: function() {
    const thisApp = this;
    console.log('initPages');

    thisApp.pages = document.querySelector(select.containerOf.pages).children;
    thisApp.navLinks = document.querySelectorAll(select.nav.links);
    console.log('pages: ', thisApp.pages);

    const idFromHash = window.location.hash.replace('#/', '');
    let pageMatchingHash = thisApp.pages[0].id;

    for(let page of thisApp.pages) {
      if(page.id == idFromHash) {
        pageMatchingHash = page.id;
        break;
      }
    }

    thisApp.activatePage(pageMatchingHash);

    for(let link of thisApp.navLinks) {
      link.addEventListener('click', function(event) {
        event.preventDefault();
        const clikedElement = this;

        // get page from href attr
        const id = clikedElement.getAttribute('href').replace('#', '');

        // run thisApp.activatePage with that id
        thisApp.activatePage(id);

        // change URL hash
        window.location.hash = '#/' + id;
      });
    }
  },

  activatePage: function(pageId) {
    const thisApp = this;

    // add class active to matching pages, remove class active from non-matching pages
    for(let page of thisApp.pages) {
      page.classList.toggle(classNames.pages.active, page.id == pageId);
    }

    // add class active to matching links, remove class active from non-matching links
    for(let link of thisApp.navLinks) {
      link.classList.toggle(
        classNames.nav.active,
        link.getAttribute('href') == '#' + pageId
      );
    }

  },

  initHome: function() {
    const thisApp = this;
    const homeContainer = document.querySelector(select.containerOf.home);

    thisApp.home = new Home(homeContainer);
    thisApp.home.init();
  },

  initBooking: function() {
    const thisApp = this;
    const bookingContainer = document.querySelector(select.containerOf.booking);

    thisApp.booking = new Booking(bookingContainer);
  },

  initCart: function() {
    const thisApp = this;

    const cartElem = document.querySelector(select.containerOf.cart);

    thisApp.cart = new Cart(cartElem);

    thisApp.productList = document.querySelector(select.containerOf.menu);
    thisApp.productList.addEventListener('add-to-cart', function(event) {
      console.log(event.detail.product);
      app.cart.add(event.detail.product);
    });
  },

  initMenu: function() {
    const thisApp = this;

    for(let productData in thisApp.data.products) {
      new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
    }
  },

  initData: function() {
    const thisApp = this;
    const url = `${settings.db.url}/${settings.db.products}`;

    thisApp.data = {};

    fetch(url)
      .then(function(rawResponse) {
        // console.log('first then in fetch rawResponse: ', rawResponse);
        return rawResponse.json();
      })
      .then(function(parsedResponse) {
        // console.log('second then in fetch parsedResponse: ', parsedResponse);

        // save parsedResponse as thisApp.data.products
        thisApp.data.products = parsedResponse;

        // execute initMenu method
        thisApp.initMenu();
      });

    // console.log('thisApp.data: ', JSON.stringify(thisApp.data));

  },

  init: function(){
    const thisApp = this;

    thisApp.initPages();
    thisApp.initData();
    thisApp.initHome();
    thisApp.initCart();
    thisApp.initBooking();
  },
};


app.init();
