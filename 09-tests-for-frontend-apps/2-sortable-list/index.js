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

    if (elements) {
      for (const child of elements) {
        const name = child.dataset.element;
        this.subElements[name] = child;
      }
    }
  }

  createElement(template) {
    return createElement(template);
  }
}

export default class SortableList extends Component {
  handleRemoveElement = ({ target }) => {
    const element = target.closest('.sortable-list__item'); 

    if ('deleteHandle' in target.dataset) {
      element.remove();
    } 
  }

  handleSortElement = (event) => {
    const element = event.target.closest('.sortable-list__item'); 
    if ('grabHandle' in event.target.dataset) {
      this.handleDragStart(element, event);
    }
  }

  handleDragStart(element, { clientX, clientY }) {
    const { x, y } = element.getBoundingClientRect();
    const { offsetWidth, offsetHeight } = element;

    this.currentIndex = [...this.element.children].findIndex(el => el === element);

    this.draggingElem = element;

    this.shift = {
      x: clientX - x,
      y: clientY - y
    };


    this.draggingElem.style.width = `${offsetWidth}px`;
    this.draggingElem.style.height = `${offsetHeight}px`;
    this.draggingElem.classList.add('sortable-list__item_dragging');
    
    this.placeholderElement = this.getPlaceholderElement({ width: offsetWidth, height: offsetHeight });
    this.draggingElem.after(this.placeholderElement);

    this.addDocumentEventListeners();
  }


  handlePointerMove = (event) => {
    const { clientX, clientY } = event;

    this.moveDraggingAt(clientX, clientY);

    const prevElem = this.placeholderElement.previousElementSibling;
    const nextElem = this.placeholderElement.nextElementSibling;

    const { firstElementChild, lastElementChild } = this.element;
    const { top: firstElementTop } = firstElementChild.getBoundingClientRect();
    const { bottom } = this.element.getBoundingClientRect();


    if (clientY < firstElementTop) {
      return firstElementChild.before(this.placeholderElement);
    }

    if (clientY > bottom) {
      return lastElementChild.after(this.placeholderElement);
    }

    if (prevElem) {
      const { top, height } = prevElem.getBoundingClientRect();
      const middlePrevElem = top + height / 2;

      if (clientY < middlePrevElem) {
        return prevElem.before(this.placeholderElement);
      }
    }

    if (nextElem) {
      const { top, height } = nextElem.getBoundingClientRect();
      const middleNextElem = top + height / 2;

      if (clientY > middleNextElem) {
        return nextElem.after(this.placeholderElement);
      }
    }
  }

  handlePointerUp = () => {
    const placeholderIndex = [...this.element.children].findIndex(child => child === this.placeholderElement);

    this.draggingElem.style.cssText = '';
    this.draggingElem.classList.remove('sortable-list__item_dragging');
    this.placeholderElement.replaceWith(this.draggingElem);
    this.draggingElem = null;

    this.removeDocumentEventListeners();

    if (placeholderIndex !== this.elementInitialIndex) {
      this.dispatchEvent('sortable-list-reorder', {
        from: this.elementInitialIndex,
        to: placeholderIndex
      });
    }
  }

  dispatchEvent(eventType, detail) {
    const event = new CustomEvent(eventType, { detail });
    this.element.dispatchEvent(event);
  }

  getPlaceholderElement({ width, height }) {
    const style = { width: `${width}px`, heigth: `${height}px`};

    const template = (
      `<li 
        class="sortable-list__placeholder" 
        style="width: ${style.width}; height: ${style.heigth}">
      </li>`
    );

    return this.createElement(template);
  }

  constructor(
    { items = [] } = {}
  ) {
    super();
    this.items = items;
  }

  get template() {
    return (`<ul class='sortable-list'></ul>`);
  }

  render() {
    this.renderList();
  }

  moveDraggingAt(clientX, clientY) {
    this.draggingElem.style.left = `${clientX - this.shift.x}px`;
    this.draggingElem.style.top = `${clientY - this.shift.y}px`;
  }

  addDocumentEventListeners () {
    document.addEventListener('pointermove', this.handlePointerMove);
    document.addEventListener('pointerup', this.handlePointerUp);
  }

  removeDocumentEventListeners () {
    document.removeEventListener('pointermove', this.handlePointerMove);
    document.removeEventListener('pointerup', this.handlePointerUp);
  }

  renderList() {
    const elements = [...this.items]
        .map(it => {
          it.classList.add('sortable-list__item');
          return it;
        });

    
    this.element.append(...elements);
  }

  initEventListeners() {
    const root = this.element;

    root.addEventListener('pointerdown', this.handleRemoveElement);
    root.addEventListener('pointerdown', this.handleSortElement);
  }

  removeEventListeners() {
    const root = this.element;

    root.addEventListener('pointerdown', this.handleRemoveElement);
    root.addEventListener('pointerdown', this.handleSortElement);
  }
}

