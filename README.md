# Svelte Table

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

- [Table component](https://hurtigruten.github.io/svelte-table/)
- [Pagination](https://hurtigruten.github.io/svelte-table/pagination)
- [Slots](https://hurtigruten.github.io/svelte-table/slots)
