import {select, templates} from '../settings.js';
import utils from '../utils.js';

class Home {
  constructor(element) {
    const thisHome = this;
    thisHome.element = element;
  }

  getElements() {
    const thisHome = this;
    console.log('getElements');
    thisHome.dom = {};
    thisHome.dom.wrapper = thisHome.element;
  }

  render() {
    const thisHome = this;

    const data = {title: 'title'};
    const generatedHTML = templates.homePage(data);

    thisHome.dom.homePage = utils.createDOMFromHTML(generatedHTML);
    thisHome.dom.wrapper.appendChild(thisHome.dom.homePage);
  }

  initCarousel() {
    const thisHome = this;
    thisHome.dom.carousel = thisHome.dom.wrapper.querySelector(select.widgets.carousel.main);
    // eslint-disable-next-line no-undef
    thisHome.carousel = new Flickity(thisHome.dom.carousel, {
      cellAlign: 'left',
      contain: true,
      autoPlay: true,
      // draggable: true,
      fullscreen: true
    });
  }

  init() {
    const thisHome = this;

    thisHome.getElements();
    thisHome.render();
    thisHome.initCarousel();
  }

}

export default Home;
