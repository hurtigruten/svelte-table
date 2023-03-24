/**
 * @vitest-environment jsdom
 */
import { render } from '@testing-library/svelte';

import Table from '../mocks/TableWithComponents.svelte';

describe('SvelteTable - custom components', () => {
	it('should render a table custom head and cell slots', () => {
		const { getByText } = render(Table, { empty: false });

		expect(getByText(/NAME/i)).toHaveAttribute('data-testid', 'custom');
		expect(getByText(/LOCATION/i)).toHaveAttribute('data-testid', 'custom');
		expect(getByText(/AGE/i)).toHaveAttribute('data-testid', 'custom');
		expect(getByText(/adam/i)).toHaveAttribute('data-testid', 'custom');
	});

	it('should render a page with custom empty slot', async () => {
		const { getByText } = render(Table, { empty: true });

		expect(getByText(/this table is empty 💩/i)).toBeInTheDocument();
	});
});
