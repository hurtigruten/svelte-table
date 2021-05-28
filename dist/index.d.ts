import { SvelteComponent } from 'svelte';

interface SvelteTableProps {
  key: string;
  title: string;
  sortable?: boolean;
  headerClass?: string;
  class?: string;
  component?: typeof SvelteComponent;
  helpModal?: typeof SvelteComponent;
  value?: (v: unknown) => string;
}

declare class SvelteTable extends SvelteComponent {
  $$prop_def: SvelteTableProps;
}

export default SvelteTable;
export { SvelteTableProps };
