# Pagination slot

Used to customize the pagination component

## let: variables

- `column` - represents the current column.
- `isColumnHovered`: boolean - toggles when any item in the column is hovered currently
- `isSorted`: boolean - toggles when the current column is the one table is being sorted by
- `sortDescending`: boolean - indicates the order of current sorting
- `sortable`: boolean - indicates if the column is sortable

- `rows`: array - all rows passed to the table.
- `firstPage`:function - invoke to go to the next page
- `prevPage`:function - invoke to go to the previous page
- `firstPage`:function - invoke to go to the first page
- `lastPage`:function - invoke to go to the last page
- `goTo`:function - invoke and pass it a page number to the page (page number stars from 1)
- `from`:number - represents which item the table is sliced from, similar to index, but starts with 1
- `to`:number - represents which item the table is sliced to
- `currentPage`:number - represents which page the pagination is currently on - starts from 1
- `totalItems`:number - represents how many items there are in total of all pages
- `totalPages`:number - represents how many pages there are
- `enabled`: (object - has properties called `firstPage, prevPage, nextPage and lastPage` with boolean values that show if the button should be enabled
