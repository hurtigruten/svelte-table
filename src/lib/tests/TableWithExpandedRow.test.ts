/**
 * @vitest-environment jsdom
 */
import { render, fireEvent } from '@testing-library/svelte';

import Table from '../mocks/TableWithExpandedRow.svelte';

describe('SvelteTable - expanded rows', () => {
	it('should render a table', () => {
		const { getByText } = render(Table);

		expect(getByText(/name/i)).toBeInTheDocument();
		expect(getByText(/adam/i)).toBeInTheDocument();
	});

	it('should expand a row when clicked on a cell and close when clicked again', async () => {
		const { queryByText, getByText } = render(Table);

		expect(queryByText(/active/i)).not.toBeInTheDocument();

		await fireEvent.click(getByText(/adam/i));
		expect(queryByText(/inactive/i)).toBeInTheDocument();
		expect(queryByText(/^active/i)).not.toBeInTheDocument();

		await fireEvent.click(getByText(/david/i));
		expect(queryByText(/inactive/i)).toBeInTheDocument();

		await fireEvent.click(getByText(/adam/i));
		expect(queryByText(/inactive/i)).not.toBeInTheDocument();
	});
});
