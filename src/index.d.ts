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
  expandedRowsComponent: typeof SvelteComponent;
}

type SvelteTableColumn = Omit<SvelteTableColumnBase, 'title'> | Omit<SvelteTableColumnBase, 'titleComponent'>;

interface SvelteTableProps {
  columns: SvelteTableColumn[];
  rows: unknown;
  sortBy?: string;
  sortOrder?: number;
  styles?: Partial<
    Record<'table' | 'thead' | 'th' | 'tbody' | 'tr' | 'td' | 'cell', string>
  >;
}

export class SvelteTable extends SvelteComponent {
  $$prop_def: SvelteTableProps;
}

export { SvelteTableProps, SvelteTableColumn };
