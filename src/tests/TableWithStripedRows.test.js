/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/svelte';

import Table from '../mocks/TableWithStripedRows.svelte';

describe('SvelteTable - striped rows', () => {
  it('should render a table', () => {
    const { getByText } = render(Table);

    expect(getByText(/name/gi)).toBeInTheDocument();
    expect(getByText(/adam/gi)).toBeInTheDocument();
  });

  it('should add classes for even and odd rows', async () => {
    const { getByText } = render(Table);

    expect(getByText(/bartek/gi).closest('tr')).toHaveClass('bg-white');
    expect(getByText(/adam/gi).closest('tr')).toHaveClass('bg-black');
    expect(getByText(/john/gi).closest('tr')).toHaveClass('bg-white');
  });
});
