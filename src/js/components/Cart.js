import {select, classNames, templates, settings} from '../settings.js';
import utils from '../utils.js';

import CartProduct from './CartProduct.js';

class Cart {
  constructor(element) {
    const thisCart = this;

    thisCart.products = [];

    thisCart.getElements(element);
    thisCart.initActions();
  }

  getElements(element) {
    const thisCart = this;

    thisCart.dom = {};

    thisCart.dom.wrapper = element;
    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
    thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
    thisCart.dom.subTotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
    thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
    thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);

    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    thisCart.dom.formSubmit = thisCart.dom.form.querySelector(select.cart.formSubmit);
    thisCart.dom.phone = thisCart.dom.form.querySelector(select.cart.phone);
    thisCart.dom.address = thisCart.dom.form.querySelector(select.cart.address);
  }

  initActions() {
    const thisCart = this;

    thisCart.dom.toggleTrigger.addEventListener('click', function() {
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });

    thisCart.dom.productList.addEventListener('update', function() {
      thisCart.update();
    });

    thisCart.dom.productList.addEventListener('remove', function(event) {
      thisCart.remove(event.detail.cartProduct);
    });

    thisCart.dom.form.addEventListener('submit', function(event) {
      event.preventDefault();
      thisCart.sendOrder();
    });
  }

  add(menuProduct) {
    const thisCart = this;

    //  generate HTML
    const generatedHTML = templates.cartProduct(menuProduct);

    //  create element using utils.createElementFromHTML
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);

    //  add element to cart list
    thisCart.dom.productList.appendChild(generatedDOM);

    // thisCart.products.push(menuProduct);
    thisCart.products.push(new CartProduct(menuProduct, generatedDOM));

    thisCart.update();
  }

  update() {
    const thisCart = this;

    let deliveryFee = settings.cart.defaultDeliveryFee;

    thisCart.totalNumber = 0;
    thisCart.subTotalPrice = 0;

    if(thisCart.products.length > 0) {
      for(let product of thisCart.products) {
        thisCart.totalNumber += product.amount;
        thisCart.subTotalPrice += product.price;
      }

      thisCart.totalPrice = thisCart.subTotalPrice + deliveryFee;

    } else {
      deliveryFee = 0;
    }
    thisCart.dom.deliveryFee.textContent = deliveryFee;
    thisCart.dom.subTotalPrice.textContent = thisCart.subTotalPrice;
    thisCart.dom.totalPrice.forEach(function(element) {
      element.textContent = thisCart.totalPrice;
    });
    thisCart.dom.totalNumber.textContent = thisCart.totalNumber;
  }

  remove(cartProduct) {
    const thisCart = this;
    const index = thisCart.products.indexOf(cartProduct);

    cartProduct.dom.wrapper.remove();
    thisCart.products.splice(index, 1);
  }

  sendOrder() {
    const thisCart = this;
    const url = `${settings.db.url}/${settings.db.orders}`;
    const payload = {};
    const address = thisCart.dom.address.value;
    const phone = thisCart.dom.phone.value;

    if(address.length < 6 && phone.length < 6) {
      alert('Add phone number and address');
    } else if(thisCart.products.length === 0) {
      alert('There is no products in the cart');
    } else {
      payload.address = address;
      payload.phone = phone;
      payload.totalPrice = thisCart.totalPrice;
      payload.subTotalPrice = thisCart.subTotalPrice;
      payload.totalNumber = thisCart.totalNumber;
      payload.deliveryFee = settings.cart.defaultDeliveryFee;
      payload.products = [];

      for(let prod of thisCart.products) {
        payload.products.push(prod.getData());
      }
      console.log(payload);

      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'aplication/json',
        },
        body: JSON.stringify(payload),
      };

      fetch(url, fetchOptions)
        .then(function(respone) {
          console.log('response: ', respone);
          return respone.json();
        })
        .then(function(parsedResponse) {
          console.log('parsedResponse POST: ', parsedResponse);
        });
    }

  }
}

export default Cart;
