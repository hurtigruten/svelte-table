<script lang="ts">
	import type { Column } from './types';
	import HeadTr from './HeadTr.svelte';

	type T = $$Generic;

	export let columns: readonly Column<T>[];
	export let sortRowsBy: (title: string, force?: boolean) => void;
	export let sortDescending: boolean;
	export let lastSortedTitle: string;
	export let isSortable: boolean;
</script>

<thead class={$$props.class}>
	{#if $$slots}
		<slot {columns} {isSortable} {lastSortedTitle} {sortDescending} {sortRowsBy} />
	{:else}
		<HeadTr {columns} {isSortable} {lastSortedTitle} {sortDescending} {sortRowsBy} />
	{/if}
</thead>
