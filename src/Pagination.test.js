/**
 * @jest-environment jsdom
 */
import { render, fireEvent, waitFor } from '@testing-library/svelte';

import Pagination from './Pagination.svelte';

const rowsMock = [
  { title: 'Option 1', age: '100', location: 'Oslo' },
  { title: 'Option 2', age: '50', location: 'Rome' },
  { title: 'Option 3', age: '3000', location: 'Stockholm' },
  { title: 'Option 4', age: '200', location: 'Oslo' },
  { title: 'Option 5', age: '70', location: 'Rome' },
  { title: 'Option 6', age: '7000', location: 'Stockholm' }
];

describe('Pagination', () => {
  it('should render a table', () => {
    const { container, getByTestId } = render(Pagination, {
      rows: rowsMock
    });

    expect(container).toBeInTheDocument();
    expect(getByTestId('previous-button')).toBeInTheDocument();
    expect(getByTestId('previous-button').closest('button')).toBeDisabled();
    expect(getByTestId('next-button').closest('button')).not.toBeDisabled();
  });

  it('should enable prev button if you go to next page', async () => {
    const { container, getByTestId } = render(Pagination, {
      rows: rowsMock,
      totalItems: rowsMock.length
    });

    expect(container).toBeInTheDocument();
    expect(getByTestId('previous-button').closest('button')).toBeDisabled();
    const nextButton = getByTestId('next-button').closest('button');
    await fireEvent.click(nextButton);
    await waitFor(() =>
      expect(
        getByTestId('previous-button').closest('button')
      ).not.toBeDisabled()
    );
  });

  it('should disable prev button if you go to back to first page', async () => {
    const { container, getByTestId } = render(Pagination, {
      rows: rowsMock,
      totalItems: rowsMock.length
    });

    expect(container).toBeInTheDocument();
    const prevButton = getByTestId('previous-button').closest('button');
    await fireEvent.click(prevButton);
    await waitFor(() =>
      expect(getByTestId('previous-button').closest('button')).toBeDisabled()
    );
  });
});
