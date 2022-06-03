# Svelte Table

[Documentation](https://hurtigruten.github.io/svelte-table/)

[Live Demo](https://svelte.dev/repl/235af12d2e8a4d5991a19f77e1cbfd24?version=3.48.0)

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
