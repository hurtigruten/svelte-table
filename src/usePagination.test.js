import Pagination from './usePagination';

describe('usePagination', () => {
  it('should create a pagination object with calculated properties', () => {
    const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const pagination = new Pagination(rows, 3);

    expect(pagination.from).toBe(1);
    expect(pagination.to).toBe(3);
    expect(pagination.totalPages).toBe(4);
    expect(pagination.currentPage).toBe(1);
    expect(pagination.totalItems).toBe(10);
    expect(pagination.results).toHaveLength(3);
    expect(pagination.results).toEqual([1, 2, 3]);
  });

  it('should allow to go to the next page and not go out of bounds', () => {
    const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const pagination = new Pagination(rows, 3);

    pagination.nextPage();
    expect(pagination.currentPage).toEqual(2);
    expect(pagination.results).toEqual([4, 5, 6]);

    pagination.nextPage();
    expect(pagination.currentPage).toEqual(3);
    expect(pagination.results).toEqual([7, 8, 9]);

    pagination.nextPage();
    expect(pagination.currentPage).toEqual(4);
    expect(pagination.results).toEqual([10]);
    expect(pagination.isEnabled('nextPage')).toBeFalsy();

    pagination.nextPage();
    expect(pagination.currentPage).toEqual(4);
    expect(pagination.results).toEqual([10]);
  });

  it('should allow to go to nth page and not go out of bounds', () => {
    const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const pagination = new Pagination(rows, 3);

    expect(pagination.isEnabled(3)).toBeTruthy();
    pagination.goTo(3);
    expect(pagination.currentPage).toEqual(3);
    expect(pagination.results).toEqual([7, 8, 9]);

    expect(pagination.isEnabled(5)).toBeFalsy();
    pagination.goTo(5);
    expect(pagination.currentPage).toEqual(3);
    expect(pagination.results).toEqual([7, 8, 9]);
    expect(pagination.isEnabled(5)).toBeFalsy();

    expect(pagination.isEnabled(4)).toBeTruthy();
    pagination.goTo(4);
    expect(pagination.currentPage).toEqual(4);
    expect(pagination.results).toEqual([10]);

    pagination.goTo(1);
    expect(pagination.currentPage).toEqual(1);
    expect(pagination.results).toEqual([1, 2, 3]);
    pagination.goTo(3);

    expect(pagination.isEnabled(0)).toBeFalsy();
    pagination.goTo(0);
    expect(pagination.currentPage).toEqual(3);
    expect(pagination.results).toEqual([7, 8, 9]);
    expect(pagination.isEnabled(0)).toBeFalsy();

    pagination.goTo(-1);
    expect(pagination.currentPage).toEqual(3);
    expect(pagination.results).toEqual([7, 8, 9]);
  });

  it('should allow to go to previous page and not go out of bounds', () => {
    const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const pagination = new Pagination(rows, 3);

    pagination.goTo(3);
    expect(pagination.currentPage).toEqual(3);
    expect(pagination.results).toEqual([7, 8, 9]);

    pagination.prevPage();
    expect(pagination.currentPage).toEqual(2);
    expect(pagination.results).toEqual([4, 5, 6]);

    pagination.prevPage();
    expect(pagination.currentPage).toEqual(1);
    expect(pagination.results).toEqual([1, 2, 3]);

    pagination.prevPage();
    expect(pagination.currentPage).toEqual(1);
    expect(pagination.results).toEqual([1, 2, 3]);
    expect(pagination.isEnabled('prevPage')).toBeFalsy();
  });

  it('should allow to go to first page', () => {
    const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const pagination = new Pagination(rows, 3);

    pagination.goTo(3);
    expect(pagination.currentPage).toEqual(3);
    expect(pagination.results).toEqual([7, 8, 9]);

    pagination.firstPage();
    expect(pagination.currentPage).toEqual(1);
    expect(pagination.results).toEqual([1, 2, 3]);
    expect(pagination.isEnabled('firstPage')).toBeFalsy();
  });

  it('should allow to go to last page', () => {
    const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const pagination = new Pagination(rows, 3);

    pagination.lastPage();
    expect(pagination.currentPage).toEqual(4);
    expect(pagination.results).toEqual([10]);
    expect(pagination.isEnabled('lastPage')).toBeFalsy();
  });

  it('should expose variables for pagination labels', () => {
    const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const pagination = new Pagination(rows, 3);

    pagination.lastPage();
    expect(pagination.currentPage).toEqual(4);
    expect(pagination.from).toEqual(10);
    expect(pagination.to).toEqual(10);
    expect(pagination.totalItems).toEqual(10);
    expect(pagination.totalPages).toEqual(4);

    pagination.firstPage();
    expect(pagination.currentPage).toEqual(1);
    expect(pagination.from).toEqual(1);
    expect(pagination.to).toEqual(3);
    expect(pagination.totalItems).toEqual(10);
    expect(pagination.totalPages).toEqual(4);
  });

  it('should work nicely if itemsPerPage is higher than item count', () => {
    const rows = [1, 2, 3, 4];
    const pagination = new Pagination(rows, 10);

    expect(pagination.isEnabled('nextPage')).toBeFalsy();
    expect(pagination.isEnabled('lastPage')).toBeFalsy();
    expect(pagination.isEnabled('firstPage')).toBeFalsy();
    expect(pagination.isEnabled('prevPage')).toBeFalsy();
    expect(pagination.from).toEqual(1);
    expect(pagination.to).toEqual(4);
  });

  it('should allow using async pagination', () => {
    const fakeResponse = {
      results: [1, 2, 3, 4, 5],
      currentPage: 1,
      totalPages: 10,
      totalItems: 45
    };

    const pagination = new Pagination(fakeResponse.results, 5, fakeResponse);
    expect(pagination.currentPage).toEqual(1);
    expect(pagination.totalPages).toEqual(10);
    expect(pagination.totalItems).toEqual(45);
    const handleNextClick = () => {
      const response = {
        results: [6, 7, 8, 9, 10],
        currentPage: 2,
        totalPages: 10,
        totalItems: 45
      };

      pagination.update(response.results, response);
    };

    const handleLastClick = () => {
      const response = {
        results: [42, 43, 44, 45],
        currentPage: 10,
        totalPages: 10,
        totalItems: 45
      };

      pagination.update(response.results, response);
    };

    handleNextClick();
    expect(pagination.currentPage).toEqual(2);
    expect(pagination.results).toEqual([6, 7, 8, 9, 10]);
    expect(pagination.isEnabled('nextPage')).toBeTruthy();
    expect(pagination.isEnabled('firstPage')).toBeTruthy();
    expect(pagination.isEnabled('lastPage')).toBeTruthy();
    expect(pagination.isEnabled('prevPage')).toBeTruthy();
    expect(pagination.isEnabled(8)).toBeTruthy();

    handleLastClick();
    expect(pagination.currentPage).toEqual(10);
    expect(pagination.results).toEqual([42, 43, 44, 45]);
    expect(pagination.isEnabled('nextPage')).toBeFalsy();
    expect(pagination.isEnabled('firstPage')).toBeTruthy();
    expect(pagination.isEnabled('lastPage')).toBeFalsy();
    expect(pagination.isEnabled('prevPage')).toBeTruthy();
    expect(pagination.isEnabled(8)).toBeTruthy();
  });
});
