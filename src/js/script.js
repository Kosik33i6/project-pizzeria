/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
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
        input: 'input[name="amount"]',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
  };

  class Product {
    constructor(id, data) {
      //  * create const thisProduct
      const thisProduct = this;
      thisProduct.id = id;
      thisProduct.data = data;

      // * render after creating inctance
      thisProduct.renderInMenu();
      thisProduct.initAccordion();
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
    initAccordion() {
      //  TODO: create const thisProduct
      const thisProduct = this;

      // TODO:  find the clickable trigger (the element that should react to clicking)
      // ? QUESTION for mentor: where did  thisProduct.element come from?
      const productElement = thisProduct.element;
      const clickableTrigger = productElement.querySelector(select.menuProduct.clickable);

      // TODO: START: add event listener to clickable trigger on event click
      clickableTrigger.addEventListener('click', function(event) {
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
  }

  const app = {

    initMenu: function() {
      const thisApp = this;

      for(let productData in thisApp.data.products) {
        new Product(productData, thisApp.data.products[productData]);
        // console.log(new Product(productData, thisApp.data.products[productData]));
      }
    },

    initData: function() {
      const thisApp = this;
      // console.log(this);
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
    },
  };


  app.init();
}
