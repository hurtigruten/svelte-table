/**
 * @jest-environment jsdom
 */
import { render, fireEvent } from '@testing-library/svelte';

import Table from '../mocks/TableWithPagination.svelte';

describe('SvelteTable - pagination', () => {
  it('should render a table with a pagination', () => {
    const { getByText } = render(Table);

    expect(getByText(/name/i)).toBeInTheDocument();
    expect(getByText(/adam/i)).toBeInTheDocument();
    expect(getByText(/\d+-\d+ of \d+/i)).toBeInTheDocument();
  });

  it('should be able to change pages', async () => {
    const { queryByText, getByText } = render(Table);

    expect(getByText(/1-2 of 7/i)).toBeInTheDocument();
    expect(getByText(/adam/i)).toBeInTheDocument();
    expect(queryByText(/john/i)).not.toBeInTheDocument();
    expect(getByText(/prev/i)).toBeDisabled();
    expect(getByText(/first/i)).toBeDisabled();

    await fireEvent.click(getByText(/next/i));

    expect(getByText(/3-4 of 7/i)).toBeInTheDocument();
    expect(queryByText(/adam/i)).not.toBeInTheDocument();
    expect(getByText(/john/i)).toBeInTheDocument();

    await fireEvent.click(getByText(/last/i));

    expect(getByText(/next/i)).toBeDisabled();
    expect(getByText(/last/i)).toBeDisabled();
    expect(getByText(/7-7 of 7/i)).toBeInTheDocument();
    expect(queryByText(/adam/i)).not.toBeInTheDocument();
    expect(queryByText(/john/i)).not.toBeInTheDocument();
    expect(getByText(/stephen/i)).toBeInTheDocument();

    await fireEvent.click(getByText(/prev/i));

    expect(getByText(/5-6 of 7/i)).toBeInTheDocument();
    expect(queryByText(/stephen/i)).not.toBeInTheDocument();
    expect(getByText(/mannuel/i)).toBeInTheDocument();

    await fireEvent.click(getByText(/first/i));

    expect(getByText(/1-2 of 7/i)).toBeInTheDocument();
    expect(queryByText(/mannuel/i)).not.toBeInTheDocument();
    expect(getByText(/bartek/i)).toBeInTheDocument();
    expect(getByText(/adam/i)).toBeInTheDocument();
    expect(getByText(/prev/i)).toBeDisabled();
    expect(getByText(/first/i)).toBeDisabled();
    expect(getByText(/next/i)).not.toBeDisabled();
    expect(getByText(/last/i)).not.toBeDisabled();
  });
});
