/**
 * @jest-environment jsdom
 */
import { render, fireEvent } from '@testing-library/svelte';

import Table from '../mocks/TableWithPagination.svelte';

describe('SvelteTable - pagination', () => {
  it('should render a table with a pagination', () => {
    const { getByText } = render(Table);

    expect(getByText(/name/gi)).toBeInTheDocument();
    expect(getByText(/adam/gi)).toBeInTheDocument();
    expect(getByText(/\d+-\d+ of \d+/gi)).toBeInTheDocument();
  });

  it('should be able to change pages', async () => {
    const { queryByText, getByText } = render(Table);

    expect(getByText(/1-2 of 7/gi)).toBeInTheDocument();
    expect(getByText(/adam/gi)).toBeInTheDocument();
    expect(queryByText(/john/gi)).not.toBeInTheDocument();
    expect(getByText(/prev/gi)).toBeDisabled();
    expect(getByText(/first/gi)).toBeDisabled();

    await fireEvent.click(getByText(/next/gi));

    expect(getByText(/3-4 of 7/gi)).toBeInTheDocument();
    expect(queryByText(/adam/gi)).not.toBeInTheDocument();
    expect(getByText(/john/gi)).toBeInTheDocument();

    await fireEvent.click(getByText(/last/gi));

    expect(getByText(/next/gi)).toBeDisabled();
    expect(getByText(/last/gi)).toBeDisabled();
    expect(getByText(/7-7 of 7/gi)).toBeInTheDocument();
    expect(queryByText(/adam/gi)).not.toBeInTheDocument();
    expect(queryByText(/john/gi)).not.toBeInTheDocument();
    expect(getByText(/stephen/gi)).toBeInTheDocument();

    await fireEvent.click(getByText(/prev/gi));

    expect(getByText(/5-6 of 7/gi)).toBeInTheDocument();
    expect(queryByText(/stephen/gi)).not.toBeInTheDocument();
    expect(getByText(/mannuel/gi)).toBeInTheDocument();

    await fireEvent.click(getByText(/first/gi));

    expect(getByText(/1-2 of 7/gi)).toBeInTheDocument();
    expect(queryByText(/mannuel/gi)).not.toBeInTheDocument();
    expect(getByText(/bartek/gi)).toBeInTheDocument();
    expect(getByText(/adam/gi)).toBeInTheDocument();
    expect(getByText(/prev/gi)).toBeDisabled();
    expect(getByText(/first/gi)).toBeDisabled();
    expect(getByText(/next/gi)).not.toBeDisabled();
    expect(getByText(/last/gi)).not.toBeDisabled();
  });
});
