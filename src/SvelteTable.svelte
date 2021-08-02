<script>
  import { createEventDispatcher } from 'svelte';
  import IconSorting from './icons/IconSorting.svelte';
  import IconTooltip from './icons/IconTooltip.svelte';

  const dispatch = createEventDispatcher();

  export let columns;
  export let rows;
  export let sortBy = '';
  export let sortOrder = 0;
  export let rowsPerPage = 5;
  export let totalItems = 0;
  export let hasPagination = false;
  export let isDynamicLoading = false;

  let activeModal = null;

  let activePage = 1;
  let from = 0;
  let to = 0;
  let totalPages = 0;
  let hasMoreItems = false;

  const removeModal = (state) => {
    if (!state) {
      activeModal = null;
    }
  };

  export let styles = {
    table: '',
    thead: '',
    th: '',
    tbody: '',
    tr: '',
    td: '',
    cell: '',
    paginationContainer: '',
    paginationInfo: '',
    paginationButtons: ''
  };

  let columnByKey = {};

  columns.forEach((col) => {
    columnByKey[col.key] = col;
  });

  const sortStrings = (a, b) => {
    if (!a) return -sortOrder;
    if (!b) return sortOrder;

    if (sortOrder > 0) {
      return a.localeCompare(b);
    } else {
      return b.localeCompare(a);
    }
  };

  const sortRows = (rows, sortOrder, from, to) => {
    rows.sort((a, b) => {
      if (typeof a[sortBy] === 'string' || typeof b[sortBy] === 'string')
        return sortStrings(a[sortBy], b[sortBy]);
      if (a[sortBy] > b[sortBy]) {
        return sortOrder;
      } else if (a[sortBy] < b[sortBy]) {
        return -sortOrder;
      }

      return 0;
    });
    if (isDynamicLoading) return rows;
    return rows.slice(from - (activePage && 1), to);
  };

  const updateSortOrder = (colKey) =>
    colKey === sortBy
      ? (sortOrder = sortOrder === 1 ? -1 : 1)
      : (sortOrder = 1);

  const handleClickCol = (event, col) => {
    updateSortOrder(col.key);
    sortBy = col.key;
    dispatch('clickCol', { event, col, key: col.key });
  };

  const handleClickRow = (event, row) => {
    dispatch('clickRow', { event, row });
  };

  const handleClickCell = (event, row, key) => {
    dispatch('clickCell', { event, row, key });
  };

  const handleClickPage = (direction) => {
    switch (direction) {
      case 'First':
        activePage = 1;
        break;
      case 'Prev':
        activePage = activePage !== 1 ? (activePage -= 1) : 1;
        break;
      case 'Next':
        activePage = activePage !== totalPages ? (activePage += 1) : totalPages;
        break;
      case 'Last':
        activePage = totalPages;
        break;
      default:
        return;
    }
    dispatch('changePage', { activePage });
  };

  const setTotalItems = (totalItems, rows) => {
    if (isDynamicLoading) {
      return totalItems !== 0 ? totalItems : rows.length;
    }
    return rows.length;
  };

  $: totalItems = setTotalItems(totalItems, rows);
  $: totalPages = Math.ceil(totalItems / rowsPerPage);
  $: from =
    activePage === 1
      ? rows.length
        ? 1
        : 0
      : (activePage - 1) * rowsPerPage + 1;
  $: to =
    activePage * rowsPerPage > totalItems
      ? totalItems
      : activePage * rowsPerPage;
  $: sortedRows = sortRows(rows, sortOrder, from, to);
  $: hasMoreItems = from + rowsPerPage < totalItems;
</script>

{#if activeModal}
  <svelte:component
    this={activeModal}
    on:toggled={({ isOpen }) => removeModal(isOpen)}
  />
{/if}

<table class={styles.table}>
  <thead class={styles.thead}>
    <slot name="header" {sortOrder} {sortBy}>
      <tr>
        {#each columns as col, i}
          <th
            on:click={col.sortable ? (e) => handleClickCol(e, col) : undefined}
            class:cursor-pointer={col.sortable}
            class:pr-4={columns.length - 1 === i}
            class={`cursor-pointer ${styles.th} ${col.headerClass}`}
          >
            {#if col.titleComponent}
              <svelte:component
                this={col.titleComponent.component || col.titleComponent}
                {...col.titleComponent.props || {}}
                {col}
              />
            {:else}
              {col.title}
            {/if}
            {#if col.sortable}
              {#if sortBy === col.key}
                <IconSorting {sortOrder} />
              {:else}
                <IconSorting sortOrder={0} />
              {/if}
            {/if}

            {#if col.helpModal}
              <button
                class="text-blue-700"
                type="button"
                on:click={() => (activeModal = col.helpModal)}
              >
                <IconTooltip />
                <span class="sr-only">Show tooltip</span>
              </button>
            {/if}
          </th>
        {/each}
      </tr>
    </slot>
  </thead>
  <tbody class={styles.tbody}>
    {#if sortedRows.length}
      {#each sortedRows as row, n}
        <slot name="row" {row} {n}>
          <tr
            on:click={(e) => {
              handleClickRow(e, row);
            }}
            class={styles.tr}
            class:bg-gray-100={row['expandRow']?.show}
          >
            {#each columns as col, i}
              <td
                on:click={(e) => {
                  handleClickCell(e, row, col.key);
                }}
                class={`${col.class} ${styles.td}`}
                class:pr-4={columns.length - 1 === i}
              >
                {#if col.component}
                  <svelte:component
                    this={col.component.component || col.component}
                    class={styles.cell}
                    {...col.component.props || {}}
                    {row}
                    {col}
                  />
                {:else}
                  <div class={styles.cell}>
                    {@html col.renderValue
                      ? col.renderValue(row)
                      : col.value(row) || ''}
                  </div>
                {/if}
              </td>
            {/each}
          </tr>
          {#each columns as col}
            {#if col.expandedRowsComponent}
              <svelte:component this={col.expandedRowsComponent} {row} {col} />
            {/if}
          {/each}
        </slot>
      {/each}
    {:else}
      <slot name="empty" />
    {/if}
  </tbody>
</table>
{#if hasPagination}
  <div class={styles.paginationContainer}>
    <p class={styles.paginationInfo}>
      {`${from}-${to} of ${totalItems}`}
    </p>
    <button
      class={styles.paginationButtons}
      type="button"
      on:click={() => handleClickPage('First')}
      disabled={activePage === 1}>First</button
    >
    <button
      class={styles.paginationButtons}
      type="button"
      on:click={() => handleClickPage('Prev')}
      disabled={activePage === 1}>Prev</button
    >
    <button
      class={styles.paginationButtons}
      type="button"
      on:click={() => handleClickPage('Next')}
      disabled={activePage === totalPages && !hasMoreItems}>Next</button
    >
    <button
      class={styles.paginationButtons}
      type="button"
      on:click={() => handleClickPage('Last')}
      disabled={activePage === totalPages && !hasMoreItems}>Last</button
    >
  </div>
{/if}
