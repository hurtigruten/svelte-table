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
The slot exposes following variables to use inside of the pagination:

### let: variables

- `rows` - (array) all rows passed to the table.
- `firstPage` - (function) - invoke to go to the next page
- `prevPage` - (function) - invoke to go to the previous page
- `firstPage` - (function) - invoke to go to the first page
- `lastPage` - (function) - invoke to go to the last page
- `goTo` - (function) - invoke and pass it a page number to the page (page number stars from 1)
- `from` - (number) - represents which item the table is sliced from, similar to index, but starts with 1
- `to` - (number) - represents which item the table is sliced to
- `currentPage` - (number) - represents which page the pagination is currently on - starts from 1
- `totalItems` - (number) - represents how many items there are in total of all pages
- `totalPages` - (number) - represents how many pages there are
- `enabled`: (object) - has properties called `firstPage, prevPage, nextPage and lastPage` with boolean values that show if the button should be enabled

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
