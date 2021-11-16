# Pagination

In order to enable pagination for the table a prop `rowsPerPage` must be passed with a number value.

## Default pagination

The default pagination uses `Pagination.svelte` component to display four buttons: "First", "Prev", "Next", "Last" and "{from}-{to} of {totalItems}" in the middle.

### Customizing

To customize those components add classes to the classes prop passed to the Table component:

```js
{
    paginationContainer: '',
    paginationInfo: '',
    paginationButtons: ''
}
```

### Example

```js
const classes = {
  paginationContainer: 'bg-blue-200',
  paginationInfo: 'flex items-center',
  paginationButtons: 'rounded'
};
```

```html
<SvelteTable
  rowsPerPage="{3}"
  {classes}
  {rows}
  {columns}
  let:nextPage
  let:prevPage
  let:enabled
  let:currentPage
  let:totalPage
/>
```

## Custom pagination component

If you want more customization options for the pagination component you can insert your own component in a `pagination` slot.

[Read more about the pagination slot](./Slot-pagination.md)

### Example

```html
<SvelteTable
  rowsPerPage="{3}"
  {rows}
  {columns}
  let:nextPage
  let:prevPage
  let:enabled
  let:currentPage
  let:totalPages
>
  <div slot="pagination">
    <button disabled="{!enabled.prevPage}" on:click="{prevPage}">
      Previous
    </button>
    <p>Showing page {currentPage} of {totalPages}</p>
    <button disabled="{!enabled.nextPage}" on:click="{nextPage}">Next</button>
  </div>
</SvelteTable>
```
