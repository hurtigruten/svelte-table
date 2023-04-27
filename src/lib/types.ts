export interface Column<T = unknown> {
	title: string;
	content: (a: T) => string | number | boolean | Date;
	sort?: (a: T, b: T) => number;
	sortable?: boolean;
	key?: string;
}

export type ColumnClickEvent<T> = CustomEvent<{
	event: (MouseEvent | KeyboardEvent) & { currentTarget: HTMLElement };
	column: Column<T>;
	columnIndex: number;
}>;

export type RowClickEvent<T> = CustomEvent<{
	event: (MouseEvent | KeyboardEvent) & { currentTarget: HTMLElement };
	row: T;
	rowIndex: number;
}>;

export type CellClickEvent<T> = CustomEvent<{
	event: (MouseEvent | KeyboardEvent) & { currentTarget: HTMLElement };
	row: T;
	rowIndex: number;
	column: Column<T>;
	columnIndex: number;
	cell: ReturnType<Column['content']>;
}>;
