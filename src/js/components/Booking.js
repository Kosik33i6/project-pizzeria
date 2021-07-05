import { select, templates } from '../settings.js';
import utils from '../utils.js';

import AmountWidget from './AmountWidget.js';

class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.element = element;

    thisBooking.render(thisBooking.bookingContainer);
    thisBooking.initWidgets();
  }

  render() {
    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = thisBooking.element;

    thisBooking.dom.bookingWidget = utils.createDOMFromHTML(generatedHTML);
    thisBooking.dom.wrapper.appendChild(thisBooking.dom.bookingWidget);

    thisBooking.dom.peopleAmount = thisBooking.dom.bookingWidget.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.bookingWidget.querySelector(select.booking.hoursAmount);
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.amountWidgetPeople = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.amountWidgetHours = new AmountWidget(thisBooking.dom.hoursAmount);
  }
}

export default Booking;
