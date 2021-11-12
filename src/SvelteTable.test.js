/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/svelte';

import SvelteTable from './SvelteTable.svelte';
import TitleComponentMock from './mocks/TitleComponentMock.svelte';
import ExpandedRows from './mocks/ExpandedRows.svelte';

const columnsWithExpandedRows = [
  {
    key: 'title',
    title: 'title',
    value: (v) => v.title,
    expandedRowsComponent: ExpandedRows
  },
  { key: 'age', title: 'Age', value: (v) => v.age },
  { key: 'location', title: 'Place', value: (v) => v.location }
];

const columnsMock = [
  { key: 'title', title: 'Title', value: (v) => v.title },
  { key: 'age', title: 'Age', value: (v) => v.age },
  { key: 'location', title: 'Place', value: (v) => v.location }
];

const columnsWithCustomTitleMock = [
  { key: 'title', titleComponent: TitleComponentMock, value: (v) => v.title },
  { key: 'age', title: 'Age', value: (v) => v.age },
  { key: 'location', title: 'Place', value: (v) => v.location }
];

const rowsMock = [
  { title: 'Option 1', age: '100', location: 'Oslo' },
  { title: 'Option 2', age: '50', location: 'Rome' },
  { title: 'Option 3', age: '3000', location: 'Stockholm' }
];

describe('SvelteTable', () => {
  xit('should render a table', () => {
    const { container, getByText } = render(SvelteTable, {
      columns: columnsMock,
      rows: rowsMock
    });

    expect(container).toBeInTheDocument();
    expect(getByText(rowsMock[0].title)).toBeInTheDocument();
    expect(getByText(rowsMock[1].age)).toBeInTheDocument();
    expect(getByText(rowsMock[2].location)).toBeInTheDocument();
  });

  xit('should use custom value method for cells', () => {
    const { getByText } = render(SvelteTable, {
      columns: columnsMock.map((col) =>
        col.title === 'Age' ? { ...col, value: (v) => Number(v.age) * 2 } : col
      ),
      rows: rowsMock
    });

    for (const row of rowsMock) {
      expect(getByText(Number(row.age) * 2)).toBeInTheDocument();
    }
  });

  xit('should render a table with custom title', () => {
    const { container, getByText, getByTestId } = render(SvelteTable, {
      columns: columnsWithCustomTitleMock,
      rows: rowsMock
    });

    expect(container).toBeInTheDocument();
    expect(getByTestId('title-component')).toBeInTheDocument();
    expect(getByText(rowsMock[0].title)).toBeInTheDocument();
    expect(getByText(rowsMock[1].age)).toBeInTheDocument();
    expect(getByText(rowsMock[2].location)).toBeInTheDocument();
  });

  xit('should render the expanded rows into the table', () => {
    const { container, getByText, getAllByText } = render(SvelteTable, {
      columns: columnsWithExpandedRows,
      rows: rowsMock
    });

    expect(container).toBeInTheDocument();
    expect(getAllByText('Mocked expanded rows component').length).toBe(3);
    expect(getByText(rowsMock[0].title)).toBeInTheDocument();
    expect(getByText(rowsMock[1].age)).toBeInTheDocument();
    expect(getByText(rowsMock[2].location)).toBeInTheDocument();
  });
});
