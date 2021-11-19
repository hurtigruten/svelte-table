import { SvelteComponent } from 'svelte';

interface SvelteTableColumnBase {
  key: string;
  title: string;
  sortable?: boolean;
  sortBy?: (a: any, b: any, sortDescending: boolean) => number;
}

type SvelteTableColumn =
  | Omit<SvelteTableColumnBase, 'title'>
  | Omit<SvelteTableColumnBase, 'titleComponent'>;

interface SvelteTableProps {
  columns: SvelteTableColumn[];
  rows: unknown[];
  classes?: Partial<
    Record<
      | 'table'
      | 'thead'
      | 'headtr'
      | 'th'
      | 'tbody'
      | 'tr'
      | 'tr-expanded'
      | 'td'
      | 'cell'
      | 'helpButton'
      | 'sortingButton'
      | 'paginationContainer'
      | 'paginationInfo'
      | 'paginationButtons',
      string
    >
  >;
  isSortable?: boolean;
  rowsPerPage?: number;
  currentPage?: number;
  asyncPagination?: boolean;
  from?: number;
  to?: number;
  totalItems?: number;
  totalPages?: number;
}

interface PaginationProps {
  classes?: Partial<
    Record<
      'paginationContainer' | 'paginationInfo' | 'paginationButtons',
      string
    >
  >;
  totalItems: number;
  from: number;
  to: number;
  nextPage: () => void;
  prevPage: () => void;
  lastPage: () => void;
  firstPage: () => void;
  enabled: {
    firstPage: boolean;
    prevPage: boolean;
    nextPage: boolean;
    lastPage: boolean;
  };
}

declare class SvelteTable extends SvelteComponent {
  $$prop_def: SvelteTableProps;
}

declare class Pagination extends SvelteComponent {
  $$prop_def: PaginationProps;
}

export { Pagination, SvelteTable, SvelteTableColumn, SvelteTableProps };
