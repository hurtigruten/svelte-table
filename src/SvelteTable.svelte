<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let columns;
  export let rows;

  export let sortBy = '';
  export let sortOrder = 0;
  let activeModal = null;

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

  $: sortedRows = rows.sort((a, b) => {
    if (typeof a[sortBy] === 'string' || typeof b[sortBy] === 'string')
      return sortStrings(a[sortBy], b[sortBy]);
    if (a[sortBy] > b[sortBy]) {
      return sortOrder;
    } else if (a[sortBy] < b[sortBy]) {
      return -sortOrder;
    }

    return 0;
  });

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
            class={`cursor-pointer ${styles.th} col.headerClass`}
          >
            {col.title}
            {#if col.sortable}
              <slot name="sortIcon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  x="0"
                  y="0"
                  width="401.998px"
                  height="401.998px"
                  viewBox="0 0 401.998 401.998"
                  style="enable-background:new 0 0 401.998 401.998;"
                  xml:space="preserve"
                >
                  <g>
                    <g>
                      <path
                        d="M73.092,164.452h255.813c4.949,0,9.233-1.807,12.848-5.424c3.613-3.616,5.427-7.898,5.427-12.847 c0-4.949-1.813-9.229-5.427-12.85L213.846,5.424C210.232,1.812,205.951,0,200.999,0s-9.233,1.812-12.85,5.424L60.242,133.331 c-3.617,3.617-5.424,7.901-5.424,12.85c0,4.948,1.807,9.231,5.424,12.847C63.863,162.645,68.144,164.452,73.092,164.452z"
                        fill={sortOrder === 1 ? 'currentColor' : 'lightGray'}
                      />
                      <path
                        d="M328.905,237.549H73.092c-4.952,0-9.233,1.808-12.85,5.421c-3.617,3.617-5.424,7.898-5.424,12.847 c0,4.949,1.807,9.233,5.424,12.848L188.149,396.57c3.621,3.617,7.902,5.428,12.85,5.428s9.233-1.811,12.847-5.428l127.907-127.906 c3.613-3.614,5.427-7.898,5.427-12.848c0-4.948-1.813-9.229-5.427-12.847C338.139,239.353,333.854,237.549,328.905,237.549z"
                        fill={sortOrder === 1 ? 'currentColor' : 'lightGray'}
                      />
                    </g>
                  </g>
                </svg>
              </slot>
            {/if}

            {#if col.helpModal}
              <button
                class="text-blue-700"
                type="button"
                on:click={() => (activeModal = col.helpModal)}
              >
                <!-- <IconTooltip /> -->
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
                {#if col.renderComponent}
                  <svelte:component
                    this={col.renderComponent.component || col.renderComponent}
                    class={styles.cell}
                    {...col.renderComponent.props || {}}
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
          {#if row['expandRow']?.show}
            {@html row['expandRow']['component']}
          {/if}
        </slot>
      {/each}
    {:else}
      <slot name="empty" />
    {/if}
  </tbody>
</table>
