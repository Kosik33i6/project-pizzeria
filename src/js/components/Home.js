import {templates} from '../settings.js';
import utils from '../utils.js';

class Home {
  constructor(element) {
    const thisHome = this;
    thisHome.element = element;
    console.log(thisHome);
  }

  getElements() {
    const thisHome = this;

    thisHome.dom = {};
    thisHome.dom.wrapper = thisHome.element;
  }

  render() {
    const thisHome = this;

    const data = {title: 'title'};
    const generatedHTML = templates.homePage(data);

    thisHome.dom.homePage = utils.createDOMFromHTML(generatedHTML);
    console.log('thisHome.dom.wrapper', thisHome.dom.wrapper);
    thisHome.dom.wrapper.appendChild(thisHome.dom.homePage);
  }

  init() {
    const thisHome = this;

    thisHome.getElements();
    thisHome.render();
  }

}

export default Home;
