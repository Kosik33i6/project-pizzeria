import { classNames, select, settings, templates } from '../settings.js';
import utils from '../utils.js';

import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.element = element;
    thisBooking.startersData = [],
    // thisBooking.tableSelected = null;

    thisBooking.render(thisBooking.bookingContainer);
    thisBooking.getElements();
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.initActions();
    console.log(thisBooking.booked);
  }

  getData() {
    const thisBooking = this;
    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);
    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking
                               + '?' + params.booking.join('&'),

      eventsCurrent: settings.db.url + '/' + settings.db.event
                                     + '?' +params.eventsCurrent.join('&'),

      eventsRepeat: settings.db.url + '/' + settings.db.event
                                    + '?' +params.eventsRepeat.join('&'),
    };

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allRespnses) {
        const bookingsResponse = allRespnses[0];
        const eventsCurrent = allRespnses[1];
        const eventsRepeat = allRespnses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrent.json(),
          eventsRepeat.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]) {
        // console.log('booking: ', bookings);
        // console.log('eventsCurrent: ', eventsCurrent);
        // console.log('eventsRepeat: ', eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;
    thisBooking.booked = {};

    for(let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for(let item of eventsRepeat) {
      if(item.repeat == 'daily') {
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }
    console.log('thisBooking.booked: ', thisBooking.booked);
    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      if(typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    const condition =    typeof thisBooking.booked[thisBooking.date] == 'undefined'
                      || typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined';

    if(condition) {
      allAvailable = true;
    }

    for(let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }
      if(
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  initActions() {
    const thisBooking = this;

    thisBooking.dom.wrapper.addEventListener('update', function() {
      thisBooking.updateDOM();
      thisBooking.resetTableSelection();
    });

    thisBooking.dom.wrapper.addEventListener('click', function(event) {
      thisBooking.bookingTable(event);
    });

    thisBooking.dom.bookingForm.addEventListener('change', function(event) {
      thisBooking.getStartersData(event);
      console.log('thisBooking.startersData: ', thisBooking.startersData);
    });

    thisBooking.dom.bookingForm.addEventListener('submit', function(event) {
      event.preventDefault();
      console.log('submit');
      thisBooking.sendBooking();
    });
  }

  sendBooking() {
    const thisBooking = this;
    const url = `${settings.db.url}/${settings.db.booking}`;
    const bookingData = thisBooking.getBookingData();
    // console.log('bookingData efore if: ',typeof bookingData);
    if(bookingData != undefined) {
      console.log('bookingData: ', bookingData);
      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'aplication/json',
        },
        body: JSON.stringify(bookingData),
      };

      fetch(url, fetchOptions)
        .then(function(respone) {
          console.log('response: ', respone);
          return respone.json();
        })
        .then(function(parsedResponse) {
          console.log('parsedResponse POST: ', parsedResponse);
          thisBooking.makeBooked(bookingData.date, bookingData.hour, bookingData.duration, bookingData.table);
          console.log('thisBooking.booked: ', thisBooking.booked);
        });
    }
  }

  getBookingData() {
    const thisBooking = this;

    const address = thisBooking.dom.address.value;
    const phone = thisBooking.dom.phone.value;
    const bookingData = {};

    if(address.length < 6 && phone.length < 6) {
      alert('Add phone number and address');
      return;
    } else {
      bookingData.date = thisBooking.date;
      bookingData.hour = utils.numberToHour(thisBooking.hour);
      bookingData.table = thisBooking.tableSelected;
      bookingData.duration = thisBooking.amountWidgetHours.value;
      bookingData.ppl =  thisBooking.amountWidgetPeople.value;
      bookingData.starters = thisBooking.startersData;
      bookingData.phone = phone;
      bookingData.address = address;
      return bookingData;
    }
  }

  getStartersData(event) {
    console.log('start getStarters method');
    const thisBooking = this;
    const clickedElement = event.target;
    const condition = clickedElement.nodeName == 'INPUT' &&
                      clickedElement.type == 'checkbox'  &&
                      clickedElement.type != 'tel'       &&
                      clickedElement.checked == true     &&
                      !thisBooking.startersData.includes(clickedElement.value);

    if(condition) {
      console.log(clickedElement);
      thisBooking.startersData.push(clickedElement.value);
    } else if(clickedElement.checked == false && clickedElement.type != 'tel') {
      console.log(clickedElement);
      const index = thisBooking.startersData.indexOf(clickedElement.value);
      thisBooking.startersData.splice(index, 1);
    }
  }

  bookingTable(event) {
    const thisBooking = this;
    const currentTable = event.target;

    if(currentTable.classList.contains(classNames.booking.tables) && !currentTable.classList.contains(classNames.booking.tableBooked)) {
      if(!currentTable.classList.contains(classNames.booking.tableSelected)) {
        thisBooking.resetTableSelection();
      }
      currentTable.classList.toggle(classNames.booking.tableSelected);
      thisBooking.tableSelected = parseInt(currentTable.getAttribute(settings.booking.tableIdAttribute));
    }
  }

  resetTableSelection() {
    const thisBooking = this;
    for(let table of thisBooking.dom.tables) {
      table.classList.remove(classNames.booking.tableSelected);
    }
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
    thisBooking.dom.tables = thisBooking.dom.bookingWidget.querySelectorAll(select.booking.tables);

  }

  getElements() {
    const thisBooking = this;

    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.bookingForm = thisBooking.dom.wrapper.querySelector(select.booking.form);
    thisBooking.dom.phone = thisBooking.dom.bookingWidget.querySelector(select.booking.phone);
    thisBooking.dom.address = thisBooking.dom.bookingWidget.querySelector(select.booking.address);
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.amountWidgetPeople = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.amountWidgetHours = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);


  }
}

export default Booking;
