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

class Tooltip extends Component {
  static instance;

  handlePointerMove = (evt) => {
    const { clientX, clientY } = evt;

    this.element.style.left = `${clientX}px`;
    this.element.style.top = `${clientY}px`;
  }

  handlePointerOver = (evt) => {
    const tooltipTemplate = evt.target.closest('[data-tooltip]');

    if (tooltipTemplate) {
      const {tooltip} = tooltipTemplate.dataset;

      this.render(tooltip);
      document.addEventListener('pointermove', this.handlePointerMove);
    }
  }

  handlePoiterOut = () => {
    if (this.element) {
      this.remove();
      document.removeEventListener('pointermove', this.handlePointerMove);
    }
  }

  constructor() {
    super();
    if (Tooltip.instance) {
      return Tooltip.instance;
    }

    Tooltip.instance = this;
  }

  get template() {
    return (
      `<div class="tooltip"></div>`
    );
  }

  render(template) {
    this.element.innerHTML = template;
    document.body.append(this.element);
  }

  initEventListeners() {
    document.addEventListener('pointerout', this.handlePoiterOut);
    document.addEventListener('pointerover', this.handlePointerOver);
  }

  initialize() {
    this.initEventListeners();
  }

  destroy() {
    super.remove();
    document.removeEventListener('pointerout', this.handlePoiterOut);
    document.removeEventListener('pointerover', this.handlePointerOver);    
    document.removeEventListener('pointermove', this.handlePointerMove);
  }
}

export default Tooltip;
