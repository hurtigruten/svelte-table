import { SvelteComponent } from 'svelte';

interface SvelteTableColumnBase {
  key: string;
  title: string;
  sortable?: boolean;
  headerClass?: string;
  class?: string;
  component?: typeof SvelteComponent;
  helpModal?: typeof SvelteComponent;
  value?: (v: unknown) => string;
  titleComponent: typeof SvelteComponent;
  expandedRowsComponent?: typeof SvelteComponent;
}

type SvelteTableColumn =
  | Omit<SvelteTableColumnBase, 'title'>
  | Omit<SvelteTableColumnBase, 'titleComponent'>;

interface SvelteTableProps {
  columns: SvelteTableColumn[];
  rows: unknown;
  sortBy?: string;
  sortOrder?: number;
  styles?: Partial<
    Record<
      | 'table'
      | 'thead'
      | 'th'
      | 'tbody'
      | 'tr'
      | 'td'
      | 'cell'
      | 'paginationContainer'
      | 'paginationInfo'
      | 'paginationButtons',
      string
    >
  >;
  hasPagination?: boolean;
  rowsPerPage?: number;
  totalItems?: number;
  isDynamicLoading?: boolean;
  activePage?: number;
}

interface PaginationProps {
  rows: unknown;
  styles?: Partial<
    Record<
      'paginationContainer' | 'paginationInfo' | 'paginationButtons',
      string
    >
  >;
  activePage?: number;
  rowsPerPage?: number;
  totalItems?: number;
  from?: number;
  to?: number;
}

declare class SvelteTable extends SvelteComponent {
  $$prop_def: SvelteTableProps;
}

declare class Pagination extends SvelteComponent {
  $$prop_def: PaginationProps;
}

export { Pagination, SvelteTable, SvelteTableColumn, SvelteTableProps };
