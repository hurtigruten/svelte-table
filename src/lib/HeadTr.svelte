<script lang="ts">
	import type { Column } from './types';
	import Th from './Th.svelte';
	type T = $$Generic;

	export let columns: readonly Column<T>[];
	export let sortRowsBy: (title: string, force?: boolean) => void;
	export let sortDescending = false;
	export let lastSortedTitle = '';
	export let isSortable = true;
</script>

<tr class={$$props.class}>
	{#each columns as column, columnIndex}
		{#if $$slots.default}
			<slot {column} {columnIndex} {sortRowsBy} {sortDescending} {isSortable} {lastSortedTitle} />
		{:else}
			<Th {column} {columnIndex} {sortRowsBy} {sortDescending} {isSortable} {lastSortedTitle} />
		{/if}
	{/each}
</tr>
