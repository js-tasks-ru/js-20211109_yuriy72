import Component from "./component.js";

export default class PageComponent extends Component {
  _components = {}
  _instances = {}

  constructor() {
    super();
  }

  addComponents() {
    const componentMap = Object.entries(this.components);
    this._components = componentMap.reduce((acc, [name, comp]) => ({...acc, [name]: comp }), this._components);
  } 

  get instanceConponents() {
    return this._instances;
  }

  set instanceConponents(instances) {
    this._instances = instances;
  }

  getComponentByName(name) {
    try {
      const component = this._components[name];

      if (!component) {
        throw Error('has no component');
      }
      return component;


    } catch (error) {
      console.log(error);
    }
  }

  initComponents() {}

  renderComponent() {
    Object.keys(this.subElements).forEach(key => {
      if (this.instanceComponent[key]) {
        const root = this.subElements[key];

        root.append(this.instanceComponent[key].element);
      }
    });
  }
  
  destroy() {
    super.destroy();

    Object.keys(this._instances)
      .forEach(
        name => this._instances[name].destroy()
      );

    this._components = null;
    this._instances = null;
  }
}