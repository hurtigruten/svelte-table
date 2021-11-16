# Cell slot

Used to customize table body cells

## let: variables

- `row` - represents the current row.
- `column` - represents the current column.
- `cell` - an shorthand alias for `row[column.key]`.
- `isRowHovered`: boolean - toggles when any item in the row is hovered currently
- `isColumnHovered`: boolean - toggles when any item in the column is hovered currently
- `handleExpand`: function - used to trigger the row expand feature
