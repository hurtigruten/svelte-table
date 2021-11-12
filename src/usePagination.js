class Pagination {
  constructor(rows, itemsPerPage, asyncOptions) {
    this.rows = rows;
    this.itemsPerPage = itemsPerPage || rows.length;
    this._currentPage = asyncOptions ? asyncOptions.currentPage : 1;
    this._asyncOptions = asyncOptions;
    this._updateFromToValues();
  }

  get from() {
    return this._from + 1;
  }

  get to() {
    return this._to + 1;
  }

  get totalPages() {
    return this._asyncOptions
      ? this._asyncOptions.totalPages
      : Math.ceil(this.rows.length / this.itemsPerPage);
  }

  get totalItems() {
    return this._asyncOptions
      ? this._asyncOptions.totalItems
      : this.rows.length;
  }

  get currentPage() {
    return this._currentPage;
  }

  get results() {
    return this._asyncOptions
      ? [...this.rows]
      : this.rows.slice(this._from, this._to + 1);
  }

  isEnabled(id) {
    switch (id) {
      case 'nextPage':
        return this.currentPage < this.totalPages;
      case 'prevPage':
        return this.currentPage > 1;
      case 'firstPage':
        return this.currentPage > 1;
      case 'lastPage':
        return this.currentPage < this.totalPages;
      default:
        return id > 0 && id <= this.totalPages;
    }
  }

  _updateFromToValues() {
    this._from = this._asyncOptions
      ? this._asyncOptions.from
      : (this.currentPage - 1) * this.itemsPerPage;
    this._to = this._asyncOptions
      ? this._asyncOptions.to
      : Math.min(this._from + this.itemsPerPage - 1, this.totalItems - 1);
  }

  update(newRows, newData) {
    this._asyncOptions = newData;
    this._currentPage = newData.currentPage;
    this.rows = newRows;
    this._updateFromToValues();
  }

  goTo(id) {
    if (!this.isEnabled(id)) return;
    this._currentPage = id;
    this._updateFromToValues();
  }

  nextPage() {
    if (!this.isEnabled('nextPage')) return;
    this._currentPage++;
    this._updateFromToValues();
  }

  prevPage() {
    if (!this.isEnabled('prevPage')) return;
    this._currentPage--;
    this._updateFromToValues();
  }

  firstPage() {
    if (!this.isEnabled('firstPage')) return;
    this._currentPage = 1;
    this._updateFromToValues();
  }

  lastPage() {
    if (!this.isEnabled('lastPage')) return;
    this._currentPage = this.totalPages;
    this._updateFromToValues();
  }
}

export default Pagination;
