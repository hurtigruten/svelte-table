<script>
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
  };
</script>

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
          on:click={() => sortRowsBy(column.key)}
          on:mouseenter={() => setHovered(colIdx, -1)}
        >
          <slot
            name="head"
            {column}
            isColumnHovered={hoverColumn === colIdx}
            isSorted={lastSortedKey === column.key}
            {sortDescending}
            sortable={isSortable && column.sortable !== false}
          />
        </th>
      {/each}
    </tr>
  </thead>
  <tbody class={classes.tbody}>
    {#each rows as row, rowIndex}
      <tr class={classes.tr}>
        {#each columns as column, columnIndex}
          <td
            class={classes.td}
            on:mouseenter={() => setHovered(columnIndex, rowIndex)}
          >
            <slot
              name="cell"
              {row}
              {column}
              cell={row[column.key]}
              isRowHovered={hoverRow === rowIndex}
              isColumnHovered={hoverColumn === columnIndex}
            />
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

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
