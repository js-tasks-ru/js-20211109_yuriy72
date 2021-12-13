// ui-component
import RangePicker from './components/range-picker/src/index.js';
import SortableTable from './components/sortable-table/src/index.js';
import ColumnChart from './components/column-chart/src/index.js';
import header from './bestsellers-header.js';

// abstract-page
import Page from './core/page.js';

// api
import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru/';

export default class Dashboard extends Page {
  url = new URL('api/dashboard/bestsellers', BACKEND_URL);

  get components() {
    return {
      sortableTable: SortableTable,
      ordersChart: ColumnChart,
      rangePicker: RangePicker
    };
  }

  get template() {
    return (
      `<div class="dashboard">
        <div class="content__top-panel">
          <h2 class="page-title">Dashboard</h2>
          <!-- RangePicker component -->
          <div data-element="rangePicker"></div>
        </div>
        <div data-element="chartsRoot" class="dashboard__charts">
          <!-- column-chart components -->
          <div data-element="ordersChart" class="dashboard__chart_orders"></div>
          <div data-element="salesChart" class="dashboard__chart_sales"></div>
          <div data-element="customersChart" class="dashboard__chart_customers"></div>
        </div>
        <h3 class="block-title">Best sellers</h3>
        <div data-element="sortableTable">
          <!-- sortable-table component -->
        </div>
      </div>`
    );
  }

  initComponents() {
    const now = new Date();
    const to = new Date();
    const from = new Date(now.setMonth(now.getMonth() - 1));

    const SortableTableComponent = this.getComponentByName('sortableTable');
    const OrdersChartComponent = this.getComponentByName('ordersChart');
    const RangePickerComponent = this.getComponentByName('rangePicker');

    const rangePicker = new RangePickerComponent({ from, to });

    const ordersChart = new OrdersChartComponent({
      url: 'api/dashboard/orders',
      range: {
        from,
        to
      },
      label: 'orders',
      link: '#'
    });

    const salesChart = new OrdersChartComponent({
      url: 'api/dashboard/sales',
      range: {
        from,
        to
      },
      label: 'sales',
      link: '#'
    });

    const customersChart = new OrdersChartComponent({
      url: 'api/dashboard/customers',
      range: {
        from,
        to
      },
      label: 'customers',
      link: '#'
    });

    const sortableTable = new SortableTableComponent(header, {
      url: `api/dashboard/bestsellers?_start=1&_end=20&from=${from.toISOString()}&to=${to.toISOString()}`,
      isSortLocally: true,
    });

    
    this.instanceComponent = {
      rangePicker,
      sortableTable,
      ordersChart,
      salesChart,
      customersChart
    };

    this.instanceConponents = this.instanceComponent;
  }

  render() {
    this.element = this.createElement(this.template);
    this.setChildren();
    this.addComponents();
    this.initComponents();
    this.renderComponent();
    this.initEventListeners();
    
    return this.element;
  }

  updateComponents = async ({ detail }) => {
    const { from, to } = detail;
    const data = await this.loadData({from, to});

    this.instanceComponent.sortableTable.update(data);
    this.instanceComponent.salesChart.update(from, to);
    this.instanceComponent.customersChart.update(from, to);
    this.instanceComponent.ordersChart.update(from, to);
  } 

  initEventListeners() {
    const rangePicker = this.instanceComponent['rangePicker'];
    rangePicker.element.addEventListener('date-select', this.updateComponents);
  }

  loadData ({from, to}) {
    this.url.searchParams.set('_start', '1');
    this.url.searchParams.set('_end', '21');
    this.url.searchParams.set('_sort', 'title');
    this.url.searchParams.set('_order', 'asc');
    this.url.searchParams.set('from', from.toISOString());
    this.url.searchParams.set('from', to.toISOString());

    return fetchJson(this.url);
  }
}
