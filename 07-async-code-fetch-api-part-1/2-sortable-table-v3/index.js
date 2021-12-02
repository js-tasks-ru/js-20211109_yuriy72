import fetchJson from './utils/fetch-json.js';
const BACKEND_URL = 'https://course-js.javascript.ru';

// utils render element
const createElement = (template) => {
  const div = document.createElement('div');
  div.innerHTML = template;

  return div.firstElementChild;
};

function throttle(func, ms) {
  let isThrottled = false;
  let savedArgs;
  let savedThis;

  function wrapper() {
    if (isThrottled) {
      savedArgs = arguments;
      savedThis = this;
      return;
    }

    func.apply(this, arguments);

    isThrottled = true;

    setTimeout(function() {
      isThrottled = false;
      if (savedArgs) {
        wrapper.apply(savedThis, savedArgs);
        savedArgs = savedThis = null;
      }
    }, ms);
  }

  return wrapper;
}

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

  set element(newElement) {
    this._element = newElement;
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

export default class SortableTable extends Component {
  handleSortItems = ({ target }) => {
    const column = target.closest('[data-sortable=true]');

    if (column) {
      const { id, order } = column.dataset;

      const header = this.getChildElementByName('header');
      const allSortableColumns = header.querySelectorAll('[data-sortable="true"]');
      const arrow = header.querySelector('.sortable-table__sort-arrow');
      const currentArrow = column.querySelector('[data-element="arrow"]');

      const newDirection = this.toggleDirectionArrow(order);   
      const findColumn = [...allSortableColumns].find(it => it.dataset.id === id);


      if (!currentArrow) {
        column.append(arrow);
      }

      findColumn.dataset.order = newDirection;

      this.sorted = { id, order: newDirection };

      if (this.isSortLocally) {
        this.sortOnClient(id, newDirection);
      } else {
        this.sortOnServer(id, newDirection);
      }
    }
  }

  handleScroll = async () => {
    const { bottom } = this.refToElement.getBoundingClientRect();
    const { id, order } = this.sorted;

    if (bottom < document.documentElement.clientHeight && !this.loaded && this.sortOnServer && !this.isEmptyResult) {
      this.start = this.end;
      this.end = this.start + this.step;
      
      this.loaded = true;

      const data = await this.handleLoadData(id, order, this.start, this.end)
        .finally(() => this.loaded = false);
    
      this.data = [...this.data, ...data];
      this.getChildElementByName('body').innerHTML = this.renderTableRows();
    }
  }

  
  constructor(
    headerConfig = [], 
    {
      url = '',
      sorted = {
        id: headersConfig.find(item => item.sortable).id,
        order: 'asc'
      },
      isSortLocally = false,
      step = 20,
      start = 1,
      end = start + step
    } = {}
  ) {
    super();
    this.headerConfig = headerConfig;
    this.data = [];
    this.sorted = sorted;
    this.isSortLocally = isSortLocally;

    this.start = start;
    this.step = end;

    this.end = this.start + this.step;

    this.url = new URL(url, BACKEND_URL);

    this.loaded = false;

    this.render();
  }

  toggleDirectionArrow(order) {
    const direction = {
      ['asc']: 'desc',
      ['desc']: 'asc'
    };

    return direction[order];
  }

  async sortOnClient(id, order) {
    this.data = this.sortData(id, order);
    this.getChildElementByName('body').innerHTML = this.renderTableRows(this.data);
  }

  async sortOnServer(id, order) {
    const start = 1;
    const end = start + this.step;
    const data = await this.handleLoadData(id, order, start, end);

    
    this.getChildElementByName('body').innerHTML = this.renderTableRows(data);
  }

  initEventListeners() {
    this.handleThottleScroll = throttle(this.handleScroll, 500);

    this.getChildElementByName('header').addEventListener('pointerdown', this.handleSortItems);
    document.addEventListener('scroll', this.handleThottleScroll);
  }

  removeEventListeners() {
    this.getChildElementByName('header').removeEventListener('pointerdown', this.handleSortItems);
    document.removeEventListener('scroll', this.handleThottleScroll);
  }

  get template() {
    return (
      `<div class="sortable-table">
        ${this.renderTableHead()}
        ${this.renderTableBody()}
  
        <div data-element="loading" class="loading-line sortable-table__loading-line"></div>
    
        <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
          <div>
            <p>No products satisfies your filter criteria</p>
            <button type="button" class="button-primary-outline">Reset all filters</button>
          </div>
        </div>
      </div>`
    );
  }

  async handleLoadData(title, order, start, end) {
    this.url.searchParams.set('_sort', title);
    this.url.searchParams.set('_order', order);
    this.url.searchParams.set('_start', start);
    this.url.searchParams.set('_end', end);


    if (this.isEmptyResult) {
      return;
    }

    if (this.refToElement) {
      this.refToElement.classList.add('sortable-table_loading');
    }

    const data = await fetchJson(this.url)
      .finally(() => this.refToElement.classList.remove('sortable-table_loading'));

    if (!data.length) {
      this.isEmptyResult = true;
    } else {
      this.isEmptyResult = false;
    }



    return data;
  }

  async render() { 
    const { id, order } = this.sorted;   

    this.element = this.createElement(this.template);
    this.setChildren(this.element);

    this.data = await this.handleLoadData(order, id, this.start, this.end);
    this.subElements.body.innerHTML = this.renderTableRows();

    this.initEventListeners();
  }

  renderTableHead() {
    return (
      `<div data-element="header" class="sortable-table__header sortable-table__row">
        ${this.renderTableColumnHead()}
      </div>`
    );
  }

  renderTableBody() {
    return (
      `<div data-element="body" class="sortable-table__body"></div>`
    );
  }

  renderTableRows() {
    return this.data.map(
      (item) => (
        `<a href="/products/${item.id}" class="sortable-table__row">
          ${this.renderTableRow(item)}
        </a>`
      )
    )
    .join(' ');
  }

  renderTableRow(item) {
    const cell = this.headerConfig.map(({ id, template }) => ({ id, template }));

    return cell.map(({ id, template }) => template ? template(item[id]) : (`<div class="sortable-table__cell">${item[id]}</div>`)
    ).join(' ');
  }

  renderTableColumnHead() {
    const hasOrder = (id) => this.sorted.id === id ? this.sorted.order : 'asc';
    const arrowTemplate = (
      `<span data-element="arrow" class="sortable-table__sort-arrow">
        <span class="sort-arrow"></span>
      </span>`
    );

    const renderSortArrow = (id) => this.sorted.id === id ? arrowTemplate : '';

    return this.headerConfig.map((it) => {
      return (
        `<div class="sortable-table__cell" data-id="${it.id}" data-sortable="${it.sortable}" data-order='${hasOrder(it.id)}'>
            <span>${it.title}</span>
            ${renderSortArrow(it.id)}
        </div>`
      );
    })
    .join(' ');
  }

  sortData(field, order) {
    const SortTypes = {
      ASC: 'asc',
      DESC: 'desc'
    };
    
    const Direction = {
      [SortTypes.ASC]: 1,
      [SortTypes.DESC]: -1
    };

    const DataTypes = {
      STRING: 'string',
      NUMBER: 'number'
    };

    const currentSort = this.headerConfig.find(({ id }) => id === field);

    if (currentSort) {
      const { sortType } = currentSort;
      
      switch (sortType) {
      case DataTypes.NUMBER:
        return [...this.data].sort(
          (a, b) => (a[field] - b[field]) * Direction[order]
        );

      case DataTypes.STRING:
        return [...this.data].sort(
          (a, b) => a[field].localeCompare(b[field], ['ru', 'eng']) * Direction[order]
        );
      }
    }
  }
}