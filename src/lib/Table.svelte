<script lang="ts">
	import type { RowClickEvent, CellClickEvent, ColumnClickEvent } from './types';
	import './reset.css';

	import Pagination from './Pagination.svelte';
	import { createEventDispatcher } from 'svelte';

	import { sortWith } from './utils/sort/sortWith';
	import { toSorted } from './utils/sort/toSorted';
	import { toReverted } from './utils/sort/toReversed';
	import SortIcon from './SortIcon.svelte';

	type Row = $$Generic;
	type Column = $$Generic<{
		title: string;
		content: (a: Row) => string | number | boolean | Date;
		sort?: (a: Row, b: Row) => number;
		sortable?: boolean;
		key?: string;
	}>;
	type $$Events = {
		clickCol: ColumnClickEvent<Row>;
		clickRow: RowClickEvent<Row>;
		clickCell: CellClickEvent<Row>;
	};

	type $$Slots = {
		headTr: {
			columns: readonly Column[];
			lastSortedTitle: typeof lastSortedTitle;
			sortDescending: boolean;
			isSortable: boolean;
			sortRowsBy: typeof sortRowsBy;
		};
		head: {
			column: Column;
			isSorted: boolean;
			sortDescending: boolean;
			sortable: boolean;
			sortRowsBy: typeof sortRowsBy;
		};
		sortButton: {
			column: Column;
			sortDescending: boolean;
			isSorted: boolean;
		};
		cell: {
			row: Row;
			column: Column;
			cell: string | number | boolean | Date;
		};
		expanded: {
			row: Row;
		};
		pagination: {
			rows: readonly Row[];
			firstPage: () => void;
			lastPage: () => void;
			prevPage: () => void;
			nextPage: () => void;
			enabled: typeof enabled;
			totalPages: number;
			currentPage: number;
			totalItems: number;
			from: number;
			to: number;
			goTo: typeof goTo;
		};
		empty: object;
	};
	const dispatch = createEventDispatcher();

	export let rows: readonly (Row & { isExpanded?: boolean })[] = [];
	export let columns: readonly Column[] = [];

	export let isSortable = true;
	export let asyncPagination = false;
	export let rowsPerPage = rows.length;

	export let currentPage = 1;
	export let from = 1;
	export let to = rowsPerPage;
	export let totalItems = 0;
	export let totalPages = Math.ceil(totalItems / rowsPerPage);

	let enabled = {
		nextPage: false,
		lastPage: false,
		firstPage: false,
		prevPage: false
	};
	let lastSortedTitle = '';
	let sortDescending = false;

	const goTo = (id: number) => {
		currentPage = id;
		updateFromToValues();
	};

	const nextPage = () => {
		if (!enabled.nextPage) return;
		currentPage += 1;
		updateFromToValues();
	};

	const prevPage = () => {
		if (!enabled.prevPage) return;
		currentPage -= 1;
		updateFromToValues();
	};

	const firstPage = () => {
		if (!enabled.firstPage) return;
		currentPage = 1;
		updateFromToValues();
	};

	const lastPage = () => {
		if (!enabled.lastPage) return;
		currentPage = totalPages;
		updateFromToValues();
	};

	const updateFromToValues = () => {
		from = (currentPage - 1) * rowsPerPage + 1;
		to = Math.min(from + rowsPerPage - 1, totalItems);

		enabled.nextPage = currentPage < totalPages;
		enabled.prevPage = currentPage > 1;
		enabled.firstPage = currentPage > 1;
		enabled.lastPage = currentPage < totalPages;
	};

	export const sortRowsBy = (title: string, override = false) => {
		if (!isSortable) return;

		const columnData = columns.find((column) => column.title === title);

		if (!columnData) return;
		if (columnData.sortable === false) return;

		sortDescending = getSortingOrder(title, override);

		lastSortedTitle = title;

		if (columnData.sort) {
			rows = toSorted(rows, columnData.sort);
		} else if (columnData.content) {
			rows = sortWith(rows, columnData.content);
		}

		if (sortDescending) {
			rows = toReverted(rows);
		}

		slicePaginated();
	};

	const getSortingOrder = (title: string, override = false) => {
		if (override) return sortDescending;
		if (lastSortedTitle === title) return !sortDescending;
		return false;
	};

	const slicePaginated = () => {
		filteredRows = asyncPagination ? [...rows] : rows.slice(from - 1, to);
	};

	$: filteredRows = (() => {
		if (lastSortedTitle) sortRowsBy(lastSortedTitle, true);
		return [...rows];
	})();

	$: if (rows || rowsPerPage) {
		totalItems = totalItems || rows.length;
		totalPages = Math.ceil(totalItems / rowsPerPage);
	}

	$: if (rows && filteredRows && currentPage && rowsPerPage) {
		updateFromToValues();
		slicePaginated();
	}
</script>

<div class="hrg-table__container {$$props.class}">
	<table style="--cols-length:{columns.length}" class="hrg-table" cellspacing="0">
		<thead class="hrg-table__thead">
			{#if $$slots.headTr}
				<slot
					name="headTr"
					{columns}
					{lastSortedTitle}
					{sortDescending}
					{isSortable}
					{sortRowsBy}
				/>
			{:else}
				<tr class="hrg-table__thead-tr">
					{#each columns as column, columnIndex}
						{@const ariaSort =
							lastSortedTitle === column.title
								? sortDescending
									? 'descending'
									: 'ascending'
								: 'none'}
						<th
							scope="col"
							class="hrg-table__th"
							aria-sort={ariaSort}
							on:click={(event) => {
								dispatch('clickCol', { event, column, columnIndex });
							}}
						>
							{#if $$slots.head}
								<slot
									name="head"
									{column}
									{sortRowsBy}
									isSorted={lastSortedTitle === column.title}
									{sortDescending}
									sortable={isSortable && column.sortable !== false}
								/>
							{:else if isSortable && column.sortable !== false}
								{#if $$slots.sortButton}
									<slot
										name="sortButton"
										{column}
										{sortDescending}
										isSorted={lastSortedTitle === column.title}
									/>
								{:else}
									<button
										class="hrg-table__th-btn"
										type="button"
										aria-label="Sort by {column.title}"
										on:click={() => sortRowsBy(column.title)}
										>{column.title}
										<SortIcon isSorted={lastSortedTitle === column.title} {sortDescending} />
									</button>
								{/if}
							{:else}
								<span>{column.title}</span>
							{/if}
						</th>
					{/each}
				</tr>
			{/if}
		</thead>
		<tbody class="hrg-table__tbody">
			{#each filteredRows as row, rowIndex}
				{@const isExpanded = row.isExpanded}
				{@const isEven = rowIndex % 2 === 0}
				<tr
					class={`hrg-table__tr ${isExpanded}`}
					class:hrg-table__tr-expanded={isExpanded}
					class:hrg-table__tr-odd={!isEven}
					class:hrg-table__tr-even={isEven}
					on:click={(event) => dispatch('clickRow', { event, row, rowIndex })}
				>
					{#each columns as column, columnIndex}
						<td
							class="hrg-table__td"
							on:keyup={(event) => {
								if (event.key === 'Enter') {
									dispatch('clickCol', { event, column, columnIndex });
									dispatch('clickCell', {
										event,
										column,
										columnIndex,
										row,
										rowIndex,
										cell: column.content(row)
									});
								}
							}}
							on:click={(event) => {
								dispatch('clickCol', { event, column, columnIndex });
								dispatch('clickCell', {
									event,
									column,
									columnIndex,
									row,
									rowIndex,
									cell: column.content(row)
								});
							}}
						>
							{#if $$slots.cell}
								<slot name="cell" {row} {column} cell={column.content(row)} />
							{:else}
								{column.content(row)}
							{/if}
						</td>
					{/each}
				</tr>
				{#if row.isExpanded}
					<slot name="expanded" {row} />
				{/if}
			{:else}
				<slot name="empty" />
			{/each}
		</tbody>
	</table>
	{#if rowsPerPage && totalPages > 1}
		{#if $$slots.pagination}
			<slot
				name="pagination"
				{rows}
				{firstPage}
				{lastPage}
				{prevPage}
				{nextPage}
				{enabled}
				{totalPages}
				{currentPage}
				{totalItems}
				{from}
				{to}
				{goTo}
			/>
		{:else}
			<Pagination {firstPage} {lastPage} {prevPage} {nextPage} {enabled} {totalItems} {from} {to} />
		{/if}
	{/if}
</div>
