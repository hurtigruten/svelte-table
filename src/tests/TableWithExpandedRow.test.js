/**
 * @jest-environment jsdom
 */
import { render, fireEvent } from '@testing-library/svelte';

import Table from '../mocks/TableWithExpandedRow.svelte';

describe('SvelteTable - expanded rows', () => {
  it('should render a table', () => {
    const { getByText } = render(Table);

    expect(getByText(/name/gi)).toBeInTheDocument();
    expect(getByText(/adam/gi)).toBeInTheDocument();
  });

  it('should expand a row when clicked on a cell and close when clicked again', async () => {
    const { queryByText, getByText } = render(Table);

    expect(queryByText(/active/gi)).not.toBeInTheDocument();

    await fireEvent.click(getByText(/adam/gi));
    expect(queryByText(/inactive/gi)).toBeInTheDocument();
    expect(queryByText(/^active/gi)).not.toBeInTheDocument();

    await fireEvent.click(getByText(/david/gi));
    expect(queryByText(/inactive/gi)).toBeInTheDocument();

    await fireEvent.click(getByText(/adam/gi));
    expect(queryByText(/inactive/gi)).not.toBeInTheDocument();
  });
});
