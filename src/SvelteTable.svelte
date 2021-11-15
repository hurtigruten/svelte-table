<script>
  import { createEventDispatcher } from 'svelte';
  import Pagination from './Pagination.svelte';

  const dispatch = createEventDispatcher();

  export let columns = [];
  export let rows = [];
  export let classes = {
    table: '',
    thead: '',
    tbody: '',
    tr: '',
    th: '',
    td: ''
  };
  export let isSortable = true;
  export let rowsPerPage = rows.length;

  let filteredRows = [...rows];

  let currentPage = 1;
  let from = 1;
  let to = rowsPerPage;
  let totalItems = 0;
  let totalPages = Math.ceil(rows.length / rowsPerPage);
  let enabled = {
    nextPage: false,
    lastPage: false,
    firstPage: false,
    prevPage: false
  };

  const goTo = (id) => {
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

  let lastSortedKey = '';
  let sortDescending = false;

  let hoverColumn = -1;
  let hoverRow = -1;

  const setHovered = (colIdx, rowIdx) => {
    hoverColumn = colIdx;
    hoverRow = rowIdx;
  };

  const sortRowsBy = (key) => {
    if (!isSortable) return;

    const columnData = columns.find((column) => column.key === key);
    if (columnData.sortable === false) return;

    if (lastSortedKey === key) {
      sortDescending = !sortDescending;
    } else {
      sortDescending = false;
    }

    lastSortedKey = key;

    if (columnData.sortBy) {
      rows = [...rows].sort((a, b) => sortBy(a, b, sortDescending));
      return;
    }

    rows = [...rows].sort((a, b) => {
      [a, b] = [a[key], b[key]];
      if (sortDescending) [b, a] = [a, b];
      if (typeof a === 'number') return a - b;
      return a.localeCompare(b);
    });

    slicePaginated();
  };

  const slicePaginated = () => {
    filteredRows = rows.slice(from - 1, to);
  };

  if (rowsPerPage) {
    totalItems = rows.length;
  }

  $: if (rows && currentPage && rowsPerPage) {
    updateFromToValues();
    slicePaginated();
  }

  $: totalPages = Math.ceil(totalItems / rowsPerPage);
</script>

<div class="wrapper">
  <table
    class={classes.table}
    cellspacing="0"
    on:mouseleave={() => setHovered(-1, -1)}
  >
    <thead class={classes.thead}>
      <tr class={classes.tr}>
        {#each columns as column, colIdx}
          <th
            class={classes.th}
            on:click={(event) => {
              dispatch('clickCol', { event, column });
              sortRowsBy(column.key);
            }}
            on:mouseenter={() => setHovered(colIdx, -1)}
          >
            {#if $$slots.head}
              <slot
                name="head"
                {column}
                isColumnHovered={hoverColumn === colIdx}
                isSorted={lastSortedKey === column.key}
                {sortDescending}
                sortable={isSortable && column.sortable !== false}
              />
            {:else}
              <span>{column.title}</span>
            {/if}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody class={classes.tbody}>
      {#each filteredRows as row, rowIndex}
        <tr class={classes.tr} on:click={() => dispatch('clickRow', row)}>
          {#each columns as column, columnIndex}
            <td
              class={classes.td}
              on:click={(event) => {
                dispatch('clickCol', { event, column });
                dispatch('clickCell', {
                  event,
                  column,
                  row,
                  cell: row[column.key]
                });
              }}
              on:mouseenter={() => setHovered(columnIndex, rowIndex)}
            >
              {#if $$slots.cell}
                <slot
                  name="cell"
                  {row}
                  {column}
                  cell={row[column.key]}
                  isRowHovered={hoverRow === rowIndex}
                  isColumnHovered={hoverColumn === columnIndex}
                />
              {:else}
                <span>{row[column.key]}</span>
              {/if}
            </td>
          {/each}
        </tr>
      {:else}
        <slot name="empty" />
      {/each}
    </tbody>
  </table>
  {#if rowsPerPage}
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
      />
    {:else}
      <Pagination
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
</div>

<style scoped>
  *,
  *::after,
  *::before {
    margin: 0;
    border: none;
    padding: 0;
    border-spacing: 0;
    border-collapse: collapse;
  }
</style>
