/**
 * @vitest-environment jsdom
 */
import { render, fireEvent } from '@testing-library/svelte';
import { vi } from 'vitest';

import Pagination from './Pagination.svelte';

const noop = () => undefined;

describe('Pagination', () => {
	it('should display total results and pagination page info', () => {
		const { getByText, getAllByRole } = render(Pagination, {
			from: 0,
			to: 10,
			nextPage: noop,
			prevPage: noop,
			firstPage: noop,
			lastPage: noop,
			totalItems: 25,
			enabled: {
				prevPage: true,
				firstPage: true,
				nextPage: true,
				lastPage: true
			}
		});

		expect(getByText('0-10 of 25')).toBeInTheDocument();
		expect(getAllByRole('button')).toHaveLength(4);
	});

	it('should invoke pagination methods when button clicked', async () => {
		const prevPage = vi.fn();
		const nextPage = vi.fn();
		const firstPage = vi.fn();
		const lastPage = vi.fn();

		const { getByText, getAllByRole } = render(Pagination, {
			from: 0,
			to: 10,
			nextPage,
			prevPage,
			firstPage,
			lastPage,
			totalItems: 25,
			enabled: {
				prevPage: true,
				firstPage: true,
				nextPage: true,
				lastPage: true
			}
		});

		await fireEvent.click(getByText('First'));
		expect(firstPage).toBeCalledTimes(1);
		await fireEvent.click(getByText('Prev'));
		expect(prevPage).toBeCalledTimes(1);
		await fireEvent.click(getByText('Next'));
		expect(nextPage).toBeCalledTimes(1);
		await fireEvent.click(getByText('Last'));
		expect(lastPage).toBeCalledTimes(1);
	});
});
