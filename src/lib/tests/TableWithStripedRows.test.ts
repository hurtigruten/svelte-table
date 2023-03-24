/**
 * @vitest-environment jsdom
 */
import { render } from '@testing-library/svelte';

import Table from '../mocks/TableWithStripedRows.svelte';

describe('SvelteTable - striped rows', () => {
	it('should render a table', () => {
		const { getByText } = render(Table);

		expect(getByText(/name/i)).toBeInTheDocument();
		expect(getByText(/adam/i)).toBeInTheDocument();
	});

	it('should add classes for even and odd rows', async () => {
		const { getByText } = render(Table);

		expect(getByText(/bartek/i).closest('tr')).toHaveClass('bg-white');
		expect(getByText(/adam/i).closest('tr')).toHaveClass('bg-black');
		expect(getByText(/john/i).closest('tr')).toHaveClass('bg-white');
	});
});
