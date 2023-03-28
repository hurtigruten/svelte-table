export interface Column<T = unknown> {
	title: string;
	key: (a: T) => string | number | boolean;
	sort?: (a: T, b: T) => number;
	sortable?: boolean;
}

export type ColumnClickEvent<T> = CustomEvent<{
	event: Event;
	column: Column<T>;
	columnIndex: number;
}>;

export type RowClickEvent<T> = CustomEvent<{ event?: Event; row: T; rowIndex: number }>;

export type CellClickEvent<T> = CustomEvent<{
	event: Event;
	row: T;
	rowIndex: number;
	column: Column<T>;
	columnIndex: number;
	cell: string | number | boolean;
}>;
