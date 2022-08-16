<script>
  import { createEventDispatcher } from 'svelte';
  import Pagination from './Pagination.svelte';

  const dispatch = createEventDispatcher();

  export let columns = [];
  export let rows = [];

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

  let lastSortedKey = '';
  let sortDescending = false;
  let hoverColumn = -1;
  let hoverRow = -1;

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

  const setHovered = (colIdx, rowIdx) => {
    hoverColumn = colIdx;
    hoverRow = rowIdx;
  };

  const sortRowsBy = (key, override = false) => {
    if (!isSortable) return;

    const columnData = columns.find((column) => column.key === key);
    if (columnData.sortable === false) return;

    sortDescending = getSortingOrder(key, override);

    lastSortedKey = key;

    if (columnData.sortBy) {
      rows = [...rows].sort((a, b) => {
        [a, b] = sortDescending ? [a, b] : [b, a];
        return columnData.sortBy(a, b);
      });
      slicePaginated();
      return;
    }

    rows = [...rows].sort((a, b) => {
      [a, b] = [a[key], b[key]];
      if (sortDescending) [b, a] = [a, b];
      if (typeof a === 'number') return a - b;
      if (typeof a === 'boolean') return a ? -1 : 1;
      return a?.localeCompare(b);
    });

    slicePaginated();
  };

  const getSortingOrder = (key, override = false) => {
    if(override) return sortDescending;
    if(lastSortedKey === key) return !sortDescending;
    return false;
  }

  const slicePaginated = () => {
    filteredRows = asyncPagination ? [...rows] : rows.slice(from - 1, to);
  };

  $: filteredRows = (() => {
    if(lastSortedKey) sortRowsBy(lastSortedKey, true);
    return [...rows];
  })();

  $: assignedClasses = { ...defaultClasses, ...classes };

  $: if (rows || rowsPerPage) {
    totalItems = totalItems || rows.length;
    totalPages = Math.ceil(totalItems / rowsPerPage);
  }

  $: if (rows && filteredRows && currentPage && rowsPerPage) {
    updateFromToValues();
    slicePaginated();
  }
</script>

<div class="wrapper">
  <table
    class={assignedClasses.table}
    cellspacing="0"
    on:mouseleave={() => setHovered(-1, -1)}
  >
    <thead class={assignedClasses.thead}>
      <tr class={assignedClasses.headtr}>
        {#each columns as column, colIdx}
          <th
            scope="col"
            class={assignedClasses.th}
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
    <tbody class={assignedClasses.tbody}>
      {#each filteredRows as row, rowIndex}
        {@const isExpanded = row.isExpanded
          ? assignedClasses['tr-expanded']
          : ''}
        {@const isEvenOrOdd =
          rowIndex % 2 ? assignedClasses['tr-even'] : assignedClasses['tr-odd']}
        <tr
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
                  handleExpand={() =>
                    (row.isExpanded = row.isExpanded ? !row.isExpanded : true)}
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
</div>

<style scoped>
  *,
  *::after,
  *::before {
    border-spacing: 0;
    border-collapse: collapse;
  }
</style>
