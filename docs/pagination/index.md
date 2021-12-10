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

[Read more about the pagination slot](../slots/pagination.md)

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

## Async pagination example

In order to manage a server-side pagination, where you fire a request each time the user changes the page you will need to control the `totalItems` and `currentPage` props manually. `asyncPagination` prop must be set to `true`, so the table doesn't just slice the received rows, but waits for an update instead. You can then listen on changes made to `currentPage` and react to them.

### Example

```html
<script>
  const columns = [......];
  let rows = [......];
  let currentPage = 1;
  let totalItems = 0;
  let rowsPerPage = 5;

  const handlePageChange = async (page) => {
    const skip = (page - 1) * rowsPerPage;
    const response = await fetch(`YOUR_API?skip=${skip}&take=${rowsPerPage}`);

    rows = response.data;
    totalItems = response.totalCount;
  };

  $: handlePageChange(currentPage);
</script>

<SvelteTable
  asyncPagination
  bind:currentPage
  {totalItems}
  {rowsPerPage}
  {rows}
  {columns}
/>
```
