<script>
  import { createEventDispatcher } from 'svelte';
  import IconSorting from './icons/IconSorting.svelte';
  import IconTooltip from './icons/IconTooltip.svelte';

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
    cell: ''
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
                <span class="sr-only">Show tooltip 
                  {#if col.title || col.titleComponent}
                  for
                    {#if col.titleComponent}
                      <svelte:component
                        this={col.titleComponent.component || col.titleComponent}
                        {...col.titleComponent.props || {}}
                        {col}
                      />
                    {:else}
                      {col.title}
                    {/if}
                  {/if}
                </span>
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
              e.currentTarget.toggleAttribute('aria-expanded');
            }}
            on:keydown={(e) => {
              if(e.code === 'Enter' || e.code === 'Space') {
                handleClickRow(e, row);
                e.currentTarget.toggleAttribute('aria-expanded');
              }
            }}
            tabindex="0"
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
