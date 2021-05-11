import { SvelteComponent } from 'svelte';

export interface SvelteTableProps {
  key: string;
  title: string;
  sortable?: boolean;
  headerClass?: string;
  class?: string;
  renderComponent?: typeof SvelteComponent;
  helpModal?: typeof SvelteComponent;
  value?: (v: unknown) => string;
}

declare class SvelteTable extends SvelteComponent {
  $$prop_def: SvelteTableProps;
}

export default SvelteTable;
