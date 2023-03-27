export interface Column<T = unknown> {
	title: string;
	key: (a: T) => string | number | boolean;
	sort?: (a: T, b: T) => number;
	sortable?: boolean;
}
