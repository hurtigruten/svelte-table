# Svelte Table

[![Build Status](https://travis-ci.com/hurtigruten/svelte-table.svg?branch=main)](https://travis-ci.com/hurtigruten/svelte-table)

## Quick start

```bash
npm i @hurtigruten/svelte-table --save
```

### Simple example

```html
<SvelteTable {rows} {columns} />
```

### Table with custom components

```html
<SvelteTable {rows} {columns} let:cell let:column>
  <span class="text-white bg-gray-800" slot="head">{column.title}</span>
  <span class="flex items-center bg-blue-100" slot="cell">{cell}</span>
</SvelteTable>
```

### Read more

- [Table component](docs/Table.md)
- [Pagination](docs/Pagination.md)
- [head slot](./Slot-head.md)
- [cell slot](./Slot-cell.md)
- [expanded slot](./Slot-expanded.md)
- [pagination slot](./Slot-pagination.md)
- [empty slot](./Slot-empty.md)

---

This is a customized "fork" of the following [repository](https://github.com/dasDaniel/svelte-table) which we customized beyond direct forking.
