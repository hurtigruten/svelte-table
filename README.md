# Svelte Table

```bash
npm i @hurtigruten/svelte-table --save
```

```js
import { SvelteTable } from '@hurtigruten/svelte-table';

let rows = [];
const columns = [
  {
    key: 'Id',
    title: 'ID',
    value: (v) => v.Id,
    sortable: true
  },
  {
    key: 'FirstName',
    title: 'First name',
    value: (v) => v.FirstName,
    sortable: true
  },
  {
    key: 'LastName',
    title: 'Last name',
    value: (v) => v.LastName,
    sortable: true
  }
];
```

```html
<SvelteTable {columns} {rows} styles={{ table: 'table table-striped' }} />
```

This is a customized "fork" of the following [repository](https://github.com/dasDaniel/svelte-table) which we customized beyond direct forking.
