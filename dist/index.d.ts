import { SvelteComponent } from 'svelte';

interface SvelteTableColumnBase {
  key: string;
  title: string;
  sortable?: boolean;
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
      | 'th'
      | 'tbody'
      | 'tr'
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
}

interface PaginationProps {
  styles?: Partial<
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
