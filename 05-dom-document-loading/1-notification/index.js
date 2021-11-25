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

export default class NotificationMessage extends Component {
  static instance = null;
  constructor(message, { duration = 2000, type = 'success' } = {}) {
    super();
    this.message = message;
    this.duration = duration;
    this.type = type;

    this.timeoutId = null;
  }

  get template() {
    return (`
      <div class="notification ${this.type}" style="--value:${this.duration / 1000}s">
        <div class="timer"></div>
        <div class="inner-wrapper">
          <div class="notification-header">success</div>
          <div class="notification-body">
            ${this.message}
          </div>
        </div>
      </div>
    `);
  }

  destroy() {
    super.destroy();
    this.remove();
    NotificationMessage.instance = null;
  }

  remove() {
    super.remove();
    clearTimeout(this.timeoutId);
  }

  show(wrap = document.body) {
    if (NotificationMessage.instance) {
      NotificationMessage.instance.remove();
    }

    wrap.append(this.element);

    this.timeoutId = setTimeout(() => {
      this.destroy();
    }, this.duration);

    NotificationMessage.instance = this;
  }
}
