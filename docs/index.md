## Svelte table component

### Props

```ts
  columns: Array<{
    key: string,
    title: string,
    sortable?: boolean // set to false to disable sorting for one column (default: true)
    sortBy?: (a,b) => number // set custom sorting method
  }>

  rows: Array<T = unknown>

  classes?: {
      'table'?: string
      'thead'?: string
      'headtr'?: string
      'th'?: string
      'tbody'?: string
      'tr'?: string
      'tr-expanded'?: string
      'td'?: string
      'cell'?: string
      'helpButton'?: string
      'sortingButton'?: string
      'paginationContainer'?: string
      'paginationInfo'?: string
      'paginationButtons'?: string,
  }

  isSortable?: boolean // if set to false will disable sorting on _all_ columns (default true)
  rowsPerPage?: number // used to enable pagination
  currentPage?: number // used to manually overwrite (see async pagination)
  asyncPagination?: boolean // used to disable slicing of rows array in order to simulate pagination
  from?: number // used to manually overwrite (see async pagination)
  to?: number // used to manually overwrite (see async pagination)
  totalItems?: number // used to manually overwrite (see async pagination)
  totalPages?: number // used to manually overwrite (see async pagination)
```

### Pagination

- [Pagination](./pagination)

### Slots

- [head](./slots/head)
- [cell](./slots/cell)
- [expanded](./slots/expanded)
- [pagination](./slots/pagination)
- [empty](./slots/empty)

---

## Examples

### Simple table

```js
import { SvelteTable } from '@hurtigruten/svelte-table';

let rows = [
  { Id: 1, FirstName: 'Adam', LastName: 'Smith' },
  { Id: 2, FirstName: 'Eva', LastName: 'Adams' },
  { Id: 3, FirstName: 'George', LastName: 'Brown' }
];
const columns = [
  {
    key: 'Id',
    title: 'ID',
    sortable: false
  },
  {
    key: 'FirstName',
    title: 'First name'
  },
  {
    key: 'LastName',
    title: 'Last name'
  }
];
```

```html
<SvelteTable {columns} {rows} styles={{ table: 'table table-striped' }} />
```

### Table with components

```html
<!-- ValidIcon component -->
<script>
  export let isChecked;
</script>

<span> {#if cell} ??? {:else} ???? {/if} </span>
```

```js
import { SvelteTable } from '@hurtigruten/svelte-table';
import FullName from './FullName.svelte';

let rows = [];
const columns = [
  {
    key: 'Id',
    title: 'ID',
    sortable: true
  },
  {
    key: 'FullName',
    title: 'Full name',
  },
  {
    key: 'Validated'
    title: 'Validated'
  }
];
```

You can pass a custom Svelte component or inline HTML inside of the `slot="cell"` element.

Simply use a `{#if column.key...}`, for conditional rendering og elements.

```html
<SvelteTable {columns} {rows} styles={{ table: 'table table-striped' }}
  let:cell
  let:column
  let:row
  />
  <div slot="cell>
  {#if column.key === "FullName"}
    <span>{row.firstName} {row.lastName}</span>
  {:else if column.key === "Validated"}
    <ValidIcon isChecked={cell} />
  {:else}
  <span>{cell}</span>
  {/if}
 </div>
</SvelteTable>
```
