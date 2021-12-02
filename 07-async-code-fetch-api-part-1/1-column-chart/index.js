import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

// utils render element
const createElement = (template) => {
  const div = document.createElement('div');
  div.innerHTML = template;

  return div.firstElementChild;
};

// abstract component
class Component {
  subElements = {}
  _element = null;

  constructor() {
    if (new.target === Component) {
      throw Error('you cannot create an abstract class');
    }
  }

  get refToElement() {
    return this._element;
  }

  get element() {
    if (!this._element) {
      this._element = this.createElement(this.template);
      this.beforeRender();
    }
  
    return this._element;
  }

  getChildElementByName(name) {
    try {
      return this.subElements[name];
    } catch (error) {
      throw Error('no child element with this name');
    }
  }

  beforeRender() {
    this.setChildren();
    this.render();
    this.initEventListeners();
  }

  render() {}

  remove() {
    if (this._element) {
      this._element.remove();
      this.removeEventListeners();
    }
  }

  destroy() {
    this.remove();
    this.subElements = {};
    this._element = null;
  }

  initEventListeners() {}
  removeEventListeners() {}

  setChildren() {
    const elements = [...this._element.querySelectorAll('[data-element]')];

    for (const child of elements) {
      const name = child.dataset.element;
      this.subElements[name] = child;
    }
  }

  createElement(template) {
    return createElement(template);
  }
}

export default class ColumnChart extends Component {
  constructor(
    {
      data = [], 
      url = '', 
      label = '', 
      formatHeading = (it) => it, 
      link = '', 
      range = {
        from: new Date('2020-04-06'),
        to: new Date('2020-05-06'),
      },
      value = ''
    } = {}
  ) {
    super();

    this.data = data;
    this.value = value;
    this.label = label;


    this.url = new URL(url, BACKEND_URL);
    this.range = range;


    this.link = link;
    this.formatHeading = formatHeading;

    this.maxHeight = 50;
  }

  async handleLoadData(from, to) {
    this.url.searchParams.set('to', new Date(to).toISOString());
    this.url.searchParams.set('from', new Date(from).toISOString());

    const data = await fetchJson(this.url);

    return Object.values(data).length 
      ? data
      : {};
  }

 
  get chartHeight() {
    return this.maxHeight;
  }

  get template() { 
    return (
      `<div class="column-chart column-chart_loading" style="--chart-height: ${this.chartHeight}">
          <div class="column-chart__title">
            ${this.getLabel()}
            ${this.getLink()}
          </div>
          <div class="column-chart__container">
            <div data-element="header" class="column-chart__header"></div>
              <div data-element="body" class="column-chart__chart"></div>
          </div>
      </div>`
    );
  }

  async render() {
    const { from, to } = this.range;
    
    const data = await this.handleLoadData(from, to);
    this.data = data;
    
    
    if (data) {
      this.refToElement.classList.remove('column-chart_loading');
      this.getChildElementByName('body').innerHTML = this.getColumnChart(data);
      this.getChildElementByName('header').innerHTML = this.getHeader(data);
    }
  }

  async update(from, to) {
    const data = await this.handleLoadData(from, to);
    this.range = { from, to };
    this.getChildElementByName('body').innerHTML = this.getColumnChart(data);
    this.getChildElementByName('header').innerHTML = this.getHeader(data);

    this.data = data;
    return data;
  }

  getColumnChart(data) {
    const viewData = this.getDataFromView(data);
    const max = Math.max(...viewData.map(({value}) => value));
    const scale = this.chartHeight / max;

    const getPercent = (item) => (item / max * 100).toFixed(0);

    return viewData
      .map(
        ({ value }) => (`<div style="--value: ${Math.floor(value * scale)}" data-tooltip="${getPercent(value)}%"></div>`)
      )
      .join('');
  }

  getLink() {
    return this.link ? `<a href="/${this.link}" class="column-chart__link">View all</a>` : '';
  }

  getHeader(data) {
    const max = Math.max(...this.getDataFromView(data).map(({ value }) => value));
    return this.formatHeading(max);
  }

  getLabel() {
    return this.label ? this.label : '';
  }

  getDataFromView(data) {
    return Object.values(data).length 
      ? Object.entries(data).map(([key, value]) => ({ key, value }))
      : [];
  }
}
