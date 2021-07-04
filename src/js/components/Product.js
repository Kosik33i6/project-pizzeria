import {templates, select, classNames} from '../settings.js';
import utils from '../utils.js';

import AmountWidget from './AmountWidget.js';

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

    // app.cart.add(thisProduct.prepareCartProduct());
    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct.prepareCartProduct(),
      },
    });

    thisProduct.element.dispatchEvent(event);
    console.log('add to card: ', thisProduct.prepareCartProduct());
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

export default Product;
