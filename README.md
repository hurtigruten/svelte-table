# Svelte Table

[![Build Status](https://travis-ci.com/hurtigruten/svelte-table.svg?branch=main)](https://travis-ci.com/hurtigruten/svelte-table)

```bash
npm i @hurtigruten/svelte-table --save
```

### Simple table

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

### Table with components

```html
<!-- FullName component -->
<script>
  export let row = {};
  export let col = {};
</script>

<span> {row.FirstName} {row.LastName} </span>
```

```js
import { SvelteTable } from '@hurtigruten/svelte-table';
import FullName from './FullName.svelte';

let rows = [];
const columns = [
  {
    key: 'Id',
    title: 'ID',
    value: (v) => v.Id,
    sortable: true
  },
  {
    key: 'FullName',
    title: 'Full name',
    component: FullName
  }
];
```

```html
<SvelteTable {columns} {rows} styles={{ table: 'table table-striped' }} />
```

This is a customized "fork" of the following [repository](https://github.com/dasDaniel/svelte-table) which we customized beyond direct forking.
