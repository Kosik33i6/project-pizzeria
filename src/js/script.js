/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', // CODE ADDED
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
        input: 'input.amount', // CODE CHANGED
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    // CODE ADDED START
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
    // CODE ADDED END
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    // CODE ADDED START
    cart: {
      wrapperActive: 'active',
    },
    // CODE ADDED END
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }, // CODE CHANGED
    // CODE ADDED START
    cart: {
      defaultDeliveryFee: 20,
    },
    // CODE ADDED END
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
      productSummary.priceSigle = thisProduct.priceSingle;
      productSummary.price = thisProduct.totalPrice;
      // thisProduct.prepareCartProductParams();

      return productSummary;
    }

    prepareCartProductParams() {
      const thisProduct = this;

      const formData = utils.serializeFormToObject(thisProduct.dom.form);
      const params = {};

      console.log('FORMAT DATA: ', formData);

      // for very category (param)
      for(let paramId in thisProduct.data.params) {

        console.log('-----------FIRST LOOOP BEGINING-----------------');

        const param = thisProduct.data.params[paramId];

        console.log('paramId: ', paramId);
        console.log('thisProduct.data.params : ', thisProduct.data.params);
        console.log('thisProduct.data.params[paramId]: ', thisProduct.data.params[paramId]);
        console.log('param: ', param);

        // create category param in params const eg. params = { ingredients: { name: 'Ingredients', options: {}}}
        params[paramId] = {
          label: param.label,
          options: {}
        };

        // for every option in this category
        for(let optionId in param.options) {

          console.log('******SECOND LOOP BEGINING******');
          console.log('optionId in second loop: ', optionId);
          console.log('param.options in second loop: ', param.options);

          const option = param.options[optionId];
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

          console.log('option in second LOOP: ', option);

          if(optionSelected) {
            // option is selected!
            params[paramId].options[optionId] = option.label;

            console.log('option in second loop in if statement: ', option);
          }

          console.log('******SECOND LOOP END******');
        }

        console.log('============FIRST LOOP END===========');
      }

      console.log('params: ', params);

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

      const event = new Event('update');
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
      thisCart.dom.toggleTrigger = document.querySelector(select.cart.toggleTrigger);
    }

    initActions() {
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function() {
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
    }

    add(menuProduct) {
      const thisCart = this;

      console.log('add product to card');
      // console.log(menuProduct);
      // console.log(thisCart);
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
      // console.log('*** App starting ***');
      // console.log('thisApp:', thisApp);
      // console.log('classNames:', classNames);
      // console.log('settings:', settings);
      // console.log('templates:', templates);

      thisApp.initData();
      thisApp.initMenu();
      thisApp.initCart();
    },
  };


  app.init();
}
