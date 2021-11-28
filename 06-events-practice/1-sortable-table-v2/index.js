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

      this.sort(id, newDirection);
    }
  }

  constructor(headerConfig = [], { data = [], sorted, isSortLocally = true } = {}) {
    super();
    this.headerConfig = headerConfig;
    this.data = Array.isArray(data) ? data : data.data;
    this.sorted = sorted;
    this.isSortLocally = isSortLocally;
  }

  toggleDirectionArrow(order) {
    const direction = {
      ['asc']: 'desc',
      ['desc']: 'asc'
    };

    return direction[order];
  }

  sortOnClient(id, order) {
    this.data = this.sortData(id, order);
    this.getChildElementByName('body').innerHTML = this.renderTableRows();
  }

  sortOnServer(id, order) {}

  initEventListeners() {
    this.getChildElementByName('header').addEventListener('pointerdown', this.handleSortItems);
  }

  removeEventListeners() {
    this.getChildElementByName('header').removeEventListener('pointerdown', this.handleSortItems);
  }

  get template() {
    return (
      `<div class="sortable-table">

        <div data-element="header" class="sortable-table__header sortable-table__row"></div>
        <div data-element="body" class="sortable-table__body"></div>
  
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

  render() {
    this.getChildElementByName('header').innerHTML = this.renderTableHead();

    if (this.sorted) {
      const { id, order } = this.sorted;
      this.sort(id, order);

      return;
    }

    this.getChildElementByName('body').innerHTML = this.renderTableRows();
  }

  renderTableHead() {
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

  renderRow(item) {
    return this.headerConfig.map(({ id, template }) => {
      if (template && typeof template === 'function') {
        return template(item);
      }

      return (`<div class="sortable-table__cell">${item[id]}</div>`);
    }).join(' ');
  }

  renderTableRows() {
    return this.data.map(
      (item) => (
        `<a href="/products/${item.id}" class="sortable-table__row">
          ${this.renderRow(item)}
        </a>`
      )
    )
    .join(' ');
  }


  sort(field, order) {
    if (this.isSortLocally) {
      this.sortOnClient(field, order);
    } else {
      this.sortOnServer(field, order);
    }
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
