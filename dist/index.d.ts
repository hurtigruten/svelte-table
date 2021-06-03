import { SvelteComponent } from 'svelte';

interface SvelteTableColumn {
  key: string;
  title: string;
  sortable?: boolean;
  headerClass?: string;
  class?: string;
  component?: typeof SvelteComponent;
  helpModal?: typeof SvelteComponent;
  value?: (v: unknown) => string;
}

interface SvelteTableProps {
  columns: SvelteTableColumn[];
  rows: unknown;
  sortBy?: string;
  sortOrder?: number;
  styles?: Partial<
    Record<'table' | 'thead' | 'th' | 'tbody' | 'tr' | 'td' | 'cell', string>
  >;
}

declare class SvelteTable extends SvelteComponent {
  $$prop_def: SvelteTableProps;
}

export { SvelteTable, SvelteTableColumn, SvelteTableProps };
