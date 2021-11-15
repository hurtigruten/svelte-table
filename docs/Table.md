## Svelte table component

### Props

```ts
  columns: Array<{
    key: string,
    title: string,
    sortable?: boolean // set to false to disable sorting for one column
  }>

  rows: Array<any>

  classes?: {
    table: string,
    thead: string,
    tbody: string,
    tr: string,
    th: string,
    td: string
  }

  isSortable?: boolean // if set to false will disable sorting on _all_ columns
```

### Slots

```html
[slot="head"] => Defines how a table head cell will render [slot="cell"] =>
Defines how a table body cell will render
```

#### Slot variables

When using slot you can reach each slots variable by using the `let:` directive on the parent componet.

```ts
  column: Array<{
    key: string,
    title: string,
    sortable?: boolean
  }> // represents the current column
  isColumnHovered: boolean // true if any element of current column is currently being hovered

  // slot="head" specific vars:
  isSorted: boolean // if true it means it is the column that table is currently sorted by
  sortable: boolean // true means the column is sortable
  sortDescending: boolean // represents which direction the current sorting works

  // slot="cell" specific vars:
  row: any // represents the current row
  cell: any // simply an alias for row[column.key]
  isRowHovered: boolean // true if any element of current row is currently being hovered

```

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

<span> {#if cell} ✅ {:else} 🛑 {/if} </span>
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
