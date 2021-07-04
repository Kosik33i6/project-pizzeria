import {select, settings} from './settings.js';

import Product from './components/Product.js';
import Cart from './components/Cart.js';

const app = {

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

    thisApp.initData();
    thisApp.initCart();
  },
};


app.init();
