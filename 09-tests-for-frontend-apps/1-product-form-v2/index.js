import SortableList from '../2-sortable-list/index.js';
import escapeHtml from './utils/escape-html.js';
import fetchJson from './utils/fetch-json.js';

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const BACKEND_URL = 'https://course-js.javascript.ru';


const createElement = (template) => {
  const div = document.createElement('div');
  div.innerHTML = template;

  return div.firstElementChild;
};

const flatten = (array) => array.reduce((acc, it) => {
  return acc.concat(Array.isArray(it) ? flatten(it) : it);
}, []);

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
  update(args) {}

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

  emitEvent(eventType, detail) {
    const event = new CustomEvent(eventType, {detail});
    this._element.dispatchEvent(event);
  }
}

export default class ProductForm extends Component {
  handleFormSubmit = (event) => {
    event.preventDefault();

    this.save();
  }

  handleRemoveImageItem = (event) => { 
    const deleteIndex = event.target.dataset.deleteHandle;

    if (deleteIndex) {
      const listItem = event.target.closest('li');
      listItem.remove();
    }
  }

  handleUploadImage = () => {
    const input = document.createElement('input');
    const uploadButton = this.getChildElementByName('uploadImage');
    const imageListContainer = this.getChildElementByName('imageListContainer').firstElementChild;


    input.type = 'file';
    input.accept = 'image/*';

    document.body.append(input);

    input.hidden = true;
    input.click();


    input.addEventListener('change', async () => {
      const [file] = input.files;

      if (file) {
        uploadButton.classList.add('is-loading');
        uploadButton.disabled = true;

        const formData = new FormData();

        formData.append('image', file);

        const response = await fetchJson('https://api.imgur.com/3/image', {
          method: 'POST',
          headers: {
            Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
          },
          body: formData
        })
        .finally(() => {
          uploadButton.classList.remove('is-loading');
          uploadButton.disabled = false;
          input.remove();
        });

        const { data: { link } } = response;
        imageListContainer.append(this.createImageListItem({ url: link, source: file.name }));
      }
    });
  }

  constructor (productId) {
    super();
    this.productId = productId;
    this.url = `${BACKEND_URL}/api/rest/products?/${this.productId}`;

    this.categories = [];

    this.form = {
      title: '',
      description: '',
      quantity: 1,
      subcategory: '',
      status: 1,
      price: 100,
      images: [],
      discount: 0
    };
  }

  async loadCategories() {
    const categories = await fetchJson(`${BACKEND_URL}/api/rest/categories?_sort=weight&_refs=subcategory`);

    return categories.map((category) => {
      const { subcategories } = category;

      return subcategories.map(
        ({ id, title }) => ({ id, label: `${category.title} > ${title}` })
      );
    });
  }

  async loadProduct() {
    const [product] = await fetchJson(`https://course-js.javascript.ru/api/rest/products?id=${this.productId}`);

    const keys = Object.keys(this.form);

    this.form = Object
      .entries(product)
      .reduce((acc, [key, value]) => {
        if (keys.includes(key)) {
          acc[key] = value;
        }

        return acc;
      }, {});
  }

  async getCategories() {
    const categories = await this.loadCategories();
    this.categories = flatten(categories);
  }

  initEventListeners() {
    const productForm = this.getChildElementByName('productForm');
    const imageListContainer = this.getChildElementByName('imageListContainer');
    const uploadButton = this.getChildElementByName('uploadImage');
    
    productForm.addEventListener('submit', this.handleFormSubmit);
    imageListContainer.addEventListener('click', this.handleRemoveImageItem);
    uploadButton.addEventListener('click', this.handleUploadImage);
  }


  removeEventListeners() {
    const productForm = this.getChildElementByName('productForm');
    const uploadButton = this.getChildElementByName('uploadImage');
    const imageListContainer = this.getChildElementByName('imageListContainer');

  
    productForm.removeEventListener('submit', this.handleFormSubmit);
    uploadButton.addEventListener('click', this.handleUploadImage);
    imageListContainer.addEventListener('click', this.handleRemoveImageItem);
  }

  renderCategoryFormSection() {
    const template = this.categories.map(
      ({ id, label }) => (`
        <option value="${id}">${label}</option>
      `)
    ).join('');

    return (`
      <div class="form-group form-group__half_left">
        <label class="form-label">Категория</label>
          <select id="subcategory" class="form-control" name="subcategory">
            ${template}
          </select>
      </div>`
    );
  }

  renderImagesFormSection() {
    const template = this.form.images.map(({ url, source }, i) => (
      `<li class="products-edit__imagelist-item sortable-list__item">
        <input type="hidden" name="url" value="${escapeHtml(url)}">
        <input type="hidden" name="source" value="${escapeHtml(source)}">
        <span>
          <img src="icon-grab.svg" data-grab-handle="" alt="grab">
          <img class="sortable-table__cell-img" alt="Image" src="${escapeHtml(url)}">
          <span>${escapeHtml(source)}</span>
        </span>
        <button type="button">
          <img src="icon-trash.svg" data-delete-handle="${i}" alt="delete">
        </button>
      </li>`
    ));

    const sortableList = new SortableList({
      items: template.map(item => this.createElement(item))
    });
 
    return sortableList.element;
  }

  get template() {
    return (
      `<div class="product-form">
        <form data-element="productForm" class="form-grid">
          <div class="form-group form-group__half_left">
            <fieldset>
              <label class="form-label">Название товара</label>
              <input required="" id="title" type="text" name="title" class="form-control" placeholder="Название товара">
            </fieldset>
          </div>
          <div class="form-group form-group__wide">
            <label class="form-label">Описание</label>
            <textarea required="" id="description" class="form-control" name="description" data-element="productDescription" placeholder="Описание товара"></textarea>
          </div>
          <div class="form-group form-group__wide" data-element="sortable-list-container">
            <label class="form-label">Фото</label>

            <div data-element="imageListContainer"></div>
            <button type="button" data-element="uploadImage" name="uploadImage" class="button-primary-outline"><span>Загрузить</span></button>
          </div>

          <div data-element="categoriesForm" class="form-group form-group__half_left">
            <label class="form-label">Категория</label>
          </div>
         
          <div class="form-group form-group__half_left form-group__two-col">
            <fieldset>
              <label class="form-label">Цена ($)</label>
              <input required="" id="price" type="number" name="price" class="form-control" placeholder="100">
            </fieldset>
            <fieldset>
              <label class="form-label">Скидка ($)</label>
              <input required="" id="discount" type="number" name="discount" class="form-control" placeholder="0">
            </fieldset>
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Количество</label>
            <input required="" id="quantity" type="number" class="form-control" name="quantity" placeholder="1">
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Статус</label>
            <select class="form-control" id="status" name="status">
              <option value="1">Активен</option>
              <option value="0">Неактивен</option>
            </select>
          </div>
          <div class="form-buttons">
            <button type="submit" name="save" class="button-primary-outline">
              Сохранить товар
            </button>
          </div>
      </form>
    </div>`
    );
  }

  async render () {
    this.getCategories();
    
    const initialStateForm = this.productId ? this.loadProduct() : [];

    await Promise.all([initialStateForm, this.getCategories]);
  

    this.element = this.createElement(this.template);
    this.setChildren();  
  
    this.getChildElementByName('categoriesForm').innerHTML = this.renderCategoryFormSection();
    this.getChildElementByName('imageListContainer').append(this.renderImagesFormSection());

    this.setValuesInFormControls();
    this.initEventListeners();

    return this.element;
  }

  createImageListItem({ source, url }) {
    const template = (
      `<li class="products-edit__imagelist-item sortable-list__item" style="">
        <input type="hidden" name="url" value="${escapeHtml(url)}">
        <input type="hidden" name="source" value="${escapeHtml(source)}">
        <span>
          <img src="icon-grab.svg" data-grab-handle="" alt="grab">
          <img class="sortable-table__cell-img" alt="Image" src="${escapeHtml(url)}">
          <span>${escapeHtml(source)}</span>
        </span>
        <button type="button">
          <img src="icon-trash.svg" data-delete-handle="${escapeHtml(url)}" alt="delete">
        </button>
      </li>`
    );

    return this.createElement(template);
  }

  dispatchEvent() {
    const event = this.productId 
      ? this.emitEvent('product-updated', { detail: this.productId }) 
      : this.emitEvent('product-saved');

    this.element.dispatchEvent(event);
  }

  async save() {
    const method = this.productId ? 'PATCH' : 'PUT';
    const headers = {'Content-Type': 'application/json'};

    try {
      await fetchJson(`${BACKEND_URL}/api/rest/products`, {
        method,
        headers,
        body: this.getFormData()
      });

      this.dispatchEvent();
    } catch (error) {
      console.log(error);
    }
  }

  setValuesInFormControls() {
    const keys = Object.keys(this.form).filter(key => key !== 'images');

    keys.forEach(key => {
      const control = this.getFormControl(key);
      control.value = this.form[key];
    });
  }

  getFormControl(field) {
    const productForm = this.getChildElementByName('productForm');
    return productForm.querySelector(`[name="${field}"]`);
  }

  getFormData() {
    const keys = Object.keys(this.form).filter(key => key !== 'images');
    const imageListContainer = this.getChildElementByName('imageListContainer').querySelectorAll('.sortable-list__item');

    const numbersTypePayload = ['quantity', 'status', 'price', 'discount'];

    const values = keys.reduce((acc, key) => {
      const formControl = this.getFormControl(key);

      if (numbersTypePayload.includes(key)) {
        acc[key] = parseInt(formControl.value);
      } else {
        acc[key] = formControl.value;
      }

      return acc;
    }, {});

    const images = [...imageListContainer].reduce((acc, it) => {
      const url = it.querySelector('[name="url"]').value;
      const source = it.querySelector('[name="source"]').value;

      acc.push({ url, source });
      
      return acc;
    }, []);

    return JSON.stringify({ ...values, images });
  }
}
