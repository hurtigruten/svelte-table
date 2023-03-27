<script lang="ts">
	import type { Column } from './types';

	import { createEventDispatcher } from 'svelte';
	import Pagination from './Pagination.svelte';
	import Head from './Head.svelte';

	import { sortWith } from './utils/sort/sortWith';
	import { toSorted } from './utils/sort/toSorted';
	import { toReverted } from './utils/sort/toReversed';
	import HeadTr from './HeadTr.svelte';
	import Th from './Th.svelte';

	const dispatch = createEventDispatcher();

	type Row = $$Generic;

	export let rows: readonly Row[] = [];
	export let columns: readonly Column<Row>[] = [];

	export let isSortable = true;
	export let asyncPagination = false;
	export let rowsPerPage = rows.length;

	export let fixed = false;
	export let currentPage = 1;
	export let from = 1;
	export let to = rowsPerPage;
	export let totalItems = 0;
	export let totalPages = Math.ceil(totalItems / rowsPerPage);
	const defaultClasses = {
		table: '',
		headtr: '',
		thead: '',
		tbody: '',
		tr: '',
		'tr-expanded': '',
		'tr-odd': '',
		'tr-even': '',
		th: '',
		td: ''
	};
	export let classes = defaultClasses;
	$: assignedClasses = { ...defaultClasses, ...classes };

	let enabled = {
		nextPage: false,
		lastPage: false,
		firstPage: false,
		prevPage: false
	};

	let lastSortedTitle = '';
	let sortDescending = false;
	let hoverColumn = -1;
	let hoverRow = -1;

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

	const setHovered = (colIdx: number, rowIdx: number) => {
		hoverColumn = colIdx;
		hoverRow = rowIdx;
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
		} else if (columnData.key) {
			rows = sortWith(rows, columnData.key);
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

<table
	style="--cols:{columns.length}"
	class={assignedClasses.table}
	cellspacing="0"
	on:mouseleave={() => setHovered(-1, -1)}
>
	<thead class={assignedClasses.thead}>
		<tr class={assignedClasses.headtr}>
			{#each columns as column, colIdx}
				{@const aria_sort =
					lastSortedTitle === column.title ? (sortDescending ? 'descending' : 'ascending') : 'none'}
				<th
					scope="col"
					aria-sort={aria_sort}
					class={assignedClasses.th}
					on:click={(event) => {
						dispatch('clickCol', { event, column });
					}}
					on:mouseenter={() => setHovered(colIdx, -1)}
				>
					{#if $$slots.head}
						<slot
							name="head"
							{column}
							isColumnHovered={hoverColumn === colIdx}
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
								type="button"
								aria-label="Sort by {column.title}"
								on:click={() => sortRowsBy(column.title)}>{column.title}</button
							>
						{/if}
					{:else}
						<span>{column.title}</span>
					{/if}
				</th>
			{/each}
		</tr>
	</thead>
	<tbody class={assignedClasses.tbody}>
		{#each filteredRows as row, rowIndex}
			{@const isExpanded = row.isExpanded ? assignedClasses['tr-expanded'] : ''}
			{@const isEvenOrOdd = rowIndex % 2 ? assignedClasses['tr-even'] : assignedClasses['tr-odd']}
			<tr
				style="--cols:{columns.length}"
				class={`${assignedClasses.tr} ${isExpanded} ${isEvenOrOdd}`}
				on:click={(event) => dispatch('clickRow', { event, row })}
			>
				{#each columns as column, columnIndex}
					<td
						class={assignedClasses.td}
						on:click={(event) => {
							dispatch('clickCol', { event, column });
							dispatch('clickCell', {
								event,
								column,
								row,
								cell: column.key(row)
							});
						}}
						on:mouseenter={() => setHovered(columnIndex, rowIndex)}
					>
						{#if $$slots.cell}
							<slot
								name="cell"
								{row}
								{column}
								handleExpand={() => (row.isExpanded = row.isExpanded ? !row.isExpanded : true)}
								cell={column.key(row)}
								isRowHovered={hoverRow === rowIndex}
								isColumnHovered={hoverColumn === columnIndex}
							/>
						{:else}
							<span>{column.key(row)}</span>
						{/if}
					</td>
				{/each}
			</tr>
			{#if row.isExpanded}
				<slot
					name="expanded"
					classes={assignedClasses}
					handleClick={(event) => dispatch('clickRow', { event, row })}
					{row}
				/>
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
		<Pagination
			classes={assignedClasses}
			{firstPage}
			{lastPage}
			{prevPage}
			{nextPage}
			{enabled}
			{totalItems}
			{from}
			{to}
		/>
	{/if}
{/if}

<style scoped>
	*,
	*::after,
	*::before {
		border: 0;
		background: none;
		border-spacing: 0;
		border-collapse: collapse;
		font-family: sans-serif;
		font-weight: 400;
		font-size: 1rem;
		padding: 0;
		margin: 0;
	}

	button {
		background: transparent;
		border: none;
	}

	.fixed_header {
		height: 50px;
	}

	table {
		display: grid;
		border-collapse: collapse;
		min-width: 100%;
		grid-template-columns: repeat(var(--cols), auto);
	}

	thead,
	tbody,
	tr {
		display: contents;
	}

	th,
	td {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	th {
		position: sticky;
		top: 0;
		text-align: left;
	}
</style>
