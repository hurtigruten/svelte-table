export interface Column<T = unknown> {
	key: string;
	title: string;
	sortable?: boolean;
	sortBy?: (a: T) => string | number;
	sortFn?: (a: T, b: T) => number;
}
