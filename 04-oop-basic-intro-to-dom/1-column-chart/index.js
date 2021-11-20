// utils render element
const createElement = (template) => {
  const div = document.createElement('div');
  div.innerHTML = template;

  return div.firstElementChild;
};

// abstract component
class Component {
  constructor() {
    if (new.target === Component) {
      throw Error('you cannot create an abstract class');
    }

    this._element = null;
    this._children = new Map();
  }

  get refToElement() {
    return this._element;
  }

  get element() {
    if (!this._element) {
      this._element = this._createElement(this.template);
      this.beforeRender();
    }
  
    return this._element;
  }

  getChildElementByName(name) {
    try {
      return this._children.get(name);
    } catch (error) {
      throw Error('no child element with this name');
    }
  }

  beforeRender() {
    this._setChildren();
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
    this._children.clear();
    this._element = null;
  }

  initEventListeners() {}
  removeEventListeners() {}

  _setChildren() {
    const elements = [...this._element.querySelectorAll('[data-element]')];

    for (const child of elements) {
      const name = child.dataset.element;
      this._children.set(name, child);
    }
  }

  _createElement(template) {
    return createElement(template);
  }
}


// ColumnChart component
const MAX_CHART_HEIGHT = 50;

const defaultProps = {data: [], label: '', value: '', formatHeading: (it) => it};

export default class ColumnChart extends Component {
  constructor(
    {data = [], label, formatHeading = (it) => it, link = '', value} = defaultProps
  ) {
    super();

    this._data = data;
    this._value = value;
    this._label = label;
    this._link = link;
    this._formatHeading = formatHeading;
  }

 
  get chartHeight() {
    return MAX_CHART_HEIGHT;
  }

  get template() {
    return (
      `<div class="column-chart column-chart_loading" style="--chart-height: ${this.chartHeight}">
          <div class="column-chart__title">
            ${this._getLabel()}
            ${this._getLink()}
          </div>
          <div class="column-chart__container">
            <div data-element="header" class="column-chart__header">${this._formatHeading(this._value)}</div>
              <div data-element="body" class="column-chart__chart"></div>
          </div>
      </div>`
    );
  }



  render() {
    this.getChildElementByName('body').innerHTML = this._getColumnChart();

    if (this._data.length) {
      this.refToElement.classList.remove('column-chart_loading');
    }
  }

  update(data) {
    this._data = data;
    this.render();
  }

  _getColumnChart() {
    const max = Math.max(...this._data);
    const scale = this.chartHeight / max;

    const getPercent = (item) => (item / max * 100).toFixed(0);

    return this._data
      .map(
        it => (`<div style="--value: ${Math.floor(it * scale)}" data-tooltip="${getPercent(it)}%"></div>`)
      )
      .join('');
  }

  _getLabel() {
    return !!this._label ? this._label : '';
  }

  _getLink() {
    return !!this._link ? `<a href="/${this._link}" class="column-chart__link">View all</a>` : '';
  }

  _formatHeading(value) {
    return !!value ? this._formatHeading(value) : '';
  }
}
