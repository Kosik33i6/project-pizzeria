/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    },
    cart: {
      defaultDeliveryFee: 20,
    },
    db: {
      url: '//localhost:3131',
      products: 'products',
      orders: 'orders',
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    // CODE ADDED START
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
    // CODE ADDED END
  };

  class Product {
    constructor(id, data) {
      //  * create const thisProduct
      const thisProduct = this;
      thisProduct.id = id;
      thisProduct.data = data;

      // * render after creating inctance
      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
    }
    renderInMenu() {
      //  * create const thisProduct
      const thisProduct = this;

      //  * generate HTMLL based on template
      const generatedHTML = templates.menuProduct(thisProduct.data);
      // console.log(thisProduct.data);

      // * create element using utils.createElementFromHTML
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
      // console.log(thisProduct.element);

      //  * find menu container
      const menuContainer = document.querySelector(select.containerOf.menu);

      //  * add element to menu
      menuContainer.appendChild(thisProduct.element);
    }

    getElements(){
      const thisProduct = this;

      thisProduct.dom = {};

      thisProduct.dom.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.dom.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.dom.formInputs = thisProduct.dom.form.querySelectorAll(select.all.formInputs);
      thisProduct.dom.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.dom.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.dom.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.dom.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }

    initAmountWidget() {
      const thisProduct = this;

      thisProduct.amountWidget = new AmountWidget(thisProduct.dom.amountWidgetElem);

      thisProduct.dom.amountWidgetElem.addEventListener('update', function() {
        thisProduct.processOrder();
      });
    }

    initAccordion() {
      //  TODO: create const thisProduct
      const thisProduct = this;
      const productElement = thisProduct.element;

      // TODO: START: add event listener to clickable trigger on event click
      thisProduct.dom.accordionTrigger.addEventListener('click', function(event) {
        // TODO: prevent default action for event
        event.preventDefault();

        // TODO: find active product (product that has active class)
        const activeProduct = document.querySelector(select.all.menuProductsActive);

        // TODO: if there is active product and it's not thisProduct.element, remove class active from it
        if(activeProduct !== null && activeProduct.classList.contains(classNames.menuProduct.wrapperActive) && activeProduct !== productElement) {
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        }
        // TODO: toggle active class on thisProduct.element
        productElement.classList.toggle(classNames.menuProduct.wrapperActive);
      });
    }

    initOrderForm() {
      const thisProduct = this;

      thisProduct.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });

      //  * LOOP for all inputs in product
      for(let input of thisProduct.dom.formInputs) {
        //  * add event listener to input on event change
        input.addEventListener('change', function() {
          thisProduct.processOrder();
        });
      }

      thisProduct.dom.cartButton.addEventListener('click', function(event) {
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }

    processOrder() {
      const thisProduct = this;

      // * Conver FORM to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.dom.form);

      let price = thisProduct.data.price;

      //  * for every category (param)
      for(let paramId in thisProduct.data.params) {
        // * determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];

        // * for every option in this category
        for(let optionId in param.options) {
          // * determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];

          const optionImage = thisProduct.dom.imageWrapper.querySelector(`.${paramId}-${optionId}`);

          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

          if(optionSelected) {

            // check if the option is not default
            if(!Object.keys(option).includes('default')) {
              // add option price to price variable
              price += option.price;
            }
          } else {
            // check if the option is default
            if(Object.keys(option).includes('default')) {
              // reduce price variable
              price -= option.price;
            }
          }

          if(optionImage) {
            if(optionSelected) {
              optionImage.classList.add(classNames.menuProduct.imageVisible);
            } else {
              optionImage.classList.remove(classNames.menuProduct.imageVisible);
            }
          }
        }
      }

      // * create singlePrice data for cart and assignment price
      thisProduct.priceSingle = price;

      // * update price
      price *= thisProduct.amountWidget.value;

      // * create total price data for cart
      thisProduct.totalPrice = price;

      // * update calculated price in the HTML
      thisProduct.dom.priceElem.innerHTML = price;
    }

    addToCart() {
      const thisProduct = this;

      app.cart.add(thisProduct.prepareCartProduct());
    }

    prepareCartProduct() {
      const thisProduct = this;

      const productSummary = {};

      productSummary.id = thisProduct.id;
      productSummary.name = thisProduct.data.name;
      productSummary.amount = thisProduct.amountWidget.value;
      productSummary.priceSingle = thisProduct.priceSingle;
      productSummary.price = thisProduct.totalPrice;
      productSummary.params = thisProduct.prepareCartProductParams();

      return productSummary;
    }

    prepareCartProductParams() {
      const thisProduct = this;

      const formData = utils.serializeFormToObject(thisProduct.dom.form);
      const params = {};

      // console.log('FORMAT DATA: ', formData);

      // for very category (param)
      for(let paramId in thisProduct.data.params) {

        const param = thisProduct.data.params[paramId];

        // create category param in params const eg. params = { ingredients: { name: 'Ingredients', options: {}}}
        params[paramId] = {
          label: param.label,
          options: {}
        };

        // for every option in this category
        for(let optionId in param.options) {

          const option = param.options[optionId];
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

          if(optionSelected) {
            // option is selected!
            params[paramId].options[optionId] = option.label;
          }
        }
      }
      return params;
    }

  }

  class AmountWidget {
    constructor(element) {
      const thisWidget = this;
      thisWidget.getElements(element);
      thisWidget.setValue(thisWidget.input.value);
      thisWidget.initActions();
    }

    getElements(element) {
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }

    setValue(value) {
      const thisWidget = this;

      const newValue = parseInt(value);

      // TODO: add validation
      if(thisWidget.value !== newValue && !isNaN(newValue)) {
        thisWidget.value = newValue;
      }
      if(thisWidget.value < settings.amountWidget.defaultMin) {
        thisWidget.value = settings.amountWidget.defaultMin;
      }
      if(thisWidget.value > settings.amountWidget.defaultMax) {
        thisWidget.value = settings.amountWidget.defaultMax;
      }
      thisWidget.input.value = thisWidget.value;
      thisWidget.announce();
      console.log('AmountWidget setvalue');
    }

    initActions() {
      const thisWidget = this;

      thisWidget.input.addEventListener('change', function() {
        thisWidget.setValue(thisWidget.input.value);
      });

      thisWidget.linkDecrease.addEventListener('click', function(event) {
        event.preventDefault();
        const newValue = thisWidget.value -= 1;

        thisWidget.setValue(newValue);
      });
      thisWidget.linkIncrease.addEventListener('click', function(event) {
        event.preventDefault();
        const newValue = thisWidget.value += 1;

        thisWidget.setValue(newValue);
      });
    }

    announce() {
      const thisWidget = this;

      const event = new CustomEvent('update', {
        bubbles: true,
      });
      thisWidget.element.dispatchEvent(event);
    }

  }

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
    }

    add(menuProduct) {
      const thisCart = this;

      console.log('add product to card');
      // console.log(menuProduct);
      // console.log(thisCart);

      //  generate HTML
      const generatedHTML = templates.cartProduct(menuProduct);

      //  create element using utils.createElementFromHTML
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);

      //  add element to cart list
      thisCart.dom.productList.appendChild(generatedDOM);

      // thisCart.products.push(menuProduct);
      thisCart.products.push(new cartProduct(menuProduct, generatedDOM));

      thisCart.update();
    }

    update() {
      const thisCart = this;

      let deliveryFee = settings.cart.defaultDeliveryFee;

      let totalNumber = 0, subTotalPrice = 0;

      if(thisCart.products.length > 0) {
        for(let product of thisCart.products) {
          totalNumber += product.amount;
          subTotalPrice += product.price;
        }

        thisCart.totalPrice = subTotalPrice + deliveryFee;

      } else {
        deliveryFee = 0;
      }
      thisCart.dom.deliveryFee.textContent = deliveryFee;
      thisCart.dom.subTotalPrice.textContent = subTotalPrice;
      thisCart.dom.totalPrice.forEach(function(element) {
        element.textContent = thisCart.totalPrice;
      });
      thisCart.dom.totalNumber.textContent = totalNumber;
    }

    remove(cartProduct) {
      const thisCart = this;
      const index = thisCart.products.indexOf(cartProduct);

      cartProduct.dom.wrapper.remove();
      thisCart.products.splice(index, 1);
    }

  }

  class cartProduct {
    constructor(menuProduct, element) {
      const thisCartProduct = this;

      thisCartProduct.id = menuProduct.id;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.params = menuProduct.params;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.priceSingle = menuProduct.priceSingle;

      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
    }

    getElements(element) {
      const thisCartProduct = this;

      thisCartProduct.dom = {};

      thisCartProduct.dom.wrapper = element;

      thisCartProduct.dom.amountWidgetElem = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
    }
    initAmountWidget() {
      const thisCartProduct = this;

      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidgetElem);

      thisCartProduct.dom.amountWidgetElem.addEventListener('update', function() {
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.dom.price.textContent = thisCartProduct.amountWidget.value * thisCartProduct.priceSingle;
      });
    }

    remove() {
      const thisCartProduct = this;

      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });

      thisCartProduct.dom.wrapper.dispatchEvent(event);
      console.log('remove');
    }

    initActions() {
      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener('click', function(event) {
        event.preventDefault();
      });
      thisCartProduct.dom.remove.addEventListener('click', function(event) {
        event.preventDefault();
        thisCartProduct.remove();
      });
    }
  }

  const app = {

    initCart: function() {
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);

      thisApp.cart = new Cart(cartElem);
    },

    initMenu: function() {
      const thisApp = this;

      for(let productData in thisApp.data.products) {
        new Product(productData, thisApp.data.products[productData]);
      }
    },

    initData: function() {
      const thisApp = this;
      thisApp.data = dataSource;
    },

    init: function(){
      const thisApp = this;

      thisApp.initData();
      thisApp.initMenu();
      thisApp.initCart();
    },
  };


  app.init();
}
