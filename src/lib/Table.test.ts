/**
 * @vitest-environment jsdom
 */
import type { Column } from './types';
import { render, fireEvent } from '@testing-library/svelte';
import { vi } from 'vitest';

import Table from './Table.svelte';

const noop = () => undefined;

describe('Table', () => {
	it('should render a simple table', () => {
		const rows = [
			{ name: 'Adam', age: 30, location: 'Norway', active: true },
			{ name: 'Sarah', age: 25, location: 'USA', active: true },
			{ name: 'James', age: 45, location: 'UK', active: true }
		] as const;

		const columns: readonly Column<(typeof rows)[number]>[] = [
			{ content: (x) => x.name, title: 'Name' },
			{ content: (x) => x.location, title: 'Place' },
			{ content: (x) => x.age, title: 'Years' }
		];

		const { getAllByRole } = render(Table, {
			columns,
			rows
		});

		expect(getAllByRole('cell')[0]).toHaveTextContent('Adam');
		expect(getAllByRole('cell')[1]).toHaveTextContent('Norway');
		expect(getAllByRole('cell')[2]).toHaveTextContent('30');
		expect(getAllByRole('cell')[3]).toHaveTextContent('Sarah');
		expect(getAllByRole('cell')[4]).toHaveTextContent('USA');
		expect(getAllByRole('cell')[5]).toHaveTextContent('25');
		expect(getAllByRole('cell')[6]).toHaveTextContent('James');
		expect(getAllByRole('cell')[7]).toHaveTextContent('UK');
		expect(getAllByRole('cell')[8]).toHaveTextContent('45');
	});

	it('should sort columns', async () => {
		const rows = [
			{ name: 'Adam', age: 30, location: 'Norway', active: true },
			{ name: 'Sarah', age: 25, location: 'USA', active: true },
			{ name: 'James', age: 45, location: 'UK', active: true }
		] as const;

		const columns: readonly Column<(typeof rows)[number]>[] = [
			{ content: (x) => x.name, title: 'Name' },
			{ content: (x) => x.location, title: 'Place' },
			{ content: (x) => x.age, title: 'Years' }
		];

		const { getAllByRole, getByText } = render(Table, {
			columns,
			rows
		});

		await fireEvent.click(getByText('Years'));
		expect(getAllByRole('cell')[0]).toHaveTextContent('Sarah');
		expect(getAllByRole('cell')[1]).toHaveTextContent('USA');
		expect(getAllByRole('cell')[2]).toHaveTextContent('25');
		expect(getAllByRole('cell')[3]).toHaveTextContent('Adam');
		expect(getAllByRole('cell')[4]).toHaveTextContent('Norway');
		expect(getAllByRole('cell')[5]).toHaveTextContent('30');
		expect(getAllByRole('cell')[6]).toHaveTextContent('James');
		expect(getAllByRole('cell')[7]).toHaveTextContent('UK');
		expect(getAllByRole('cell')[8]).toHaveTextContent('45');

		await fireEvent.click(getByText('Years'));
		expect(getAllByRole('cell')[0]).toHaveTextContent('James');
		expect(getAllByRole('cell')[1]).toHaveTextContent('UK');
		expect(getAllByRole('cell')[2]).toHaveTextContent('45');
		expect(getAllByRole('cell')[3]).toHaveTextContent('Adam');
		expect(getAllByRole('cell')[4]).toHaveTextContent('Norway');
		expect(getAllByRole('cell')[5]).toHaveTextContent('30');
		expect(getAllByRole('cell')[6]).toHaveTextContent('Sarah');
		expect(getAllByRole('cell')[7]).toHaveTextContent('USA');
		expect(getAllByRole('cell')[8]).toHaveTextContent('25');

		await fireEvent.click(getByText('Name'));
		expect(getAllByRole('cell')[0]).toHaveTextContent('Adam');
		expect(getAllByRole('cell')[1]).toHaveTextContent('Norway');
		expect(getAllByRole('cell')[2]).toHaveTextContent('30');
		expect(getAllByRole('cell')[3]).toHaveTextContent('James');
		expect(getAllByRole('cell')[4]).toHaveTextContent('UK');
		expect(getAllByRole('cell')[5]).toHaveTextContent('45');
		expect(getAllByRole('cell')[6]).toHaveTextContent('Sarah');
		expect(getAllByRole('cell')[7]).toHaveTextContent('USA');
		expect(getAllByRole('cell')[8]).toHaveTextContent('25');

		await fireEvent.click(getByText('Name'));
		expect(getAllByRole('cell')[0]).toHaveTextContent('Sarah');
		expect(getAllByRole('cell')[1]).toHaveTextContent('USA');
		expect(getAllByRole('cell')[2]).toHaveTextContent('25');
		expect(getAllByRole('cell')[3]).toHaveTextContent('James');
		expect(getAllByRole('cell')[4]).toHaveTextContent('UK');
		expect(getAllByRole('cell')[5]).toHaveTextContent('45');
		expect(getAllByRole('cell')[6]).toHaveTextContent('Adam');
		expect(getAllByRole('cell')[7]).toHaveTextContent('Norway');
		expect(getAllByRole('cell')[8]).toHaveTextContent('30');

		await fireEvent.click(getByText('Place'));
		expect(getAllByRole('cell')[0]).toHaveTextContent('Adam');
		expect(getAllByRole('cell')[1]).toHaveTextContent('Norway');
		expect(getAllByRole('cell')[2]).toHaveTextContent('30');
		expect(getAllByRole('cell')[3]).toHaveTextContent('James');
		expect(getAllByRole('cell')[4]).toHaveTextContent('UK');
		expect(getAllByRole('cell')[5]).toHaveTextContent('45');
		expect(getAllByRole('cell')[6]).toHaveTextContent('Sarah');
		expect(getAllByRole('cell')[7]).toHaveTextContent('USA');
		expect(getAllByRole('cell')[8]).toHaveTextContent('25');
	});
});
