import { SvelteComponent } from 'svelte';

export interface SvelteTableProps {
  key: string;
  title: string;
  sortable?: boolean;
  headerClass?: string;
  class?: string;
  component?: typeof SvelteComponent;
  helpModal?: typeof SvelteComponent;
  value?: (v: unknown) => string;
}

export class SvelteTable extends SvelteComponent {
  $$prop_def: SvelteTableProps;
}
