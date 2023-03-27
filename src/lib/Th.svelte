<script lang="ts">
	import type { Column } from './types';
	type T = $$Generic;

	export let column: Column<T>;
	export let columnIndex: number;

	export let sortRowsBy: (title: string, force?: boolean) => void;
	export let sortDescending: boolean;
	export let lastSortedTitle: string;
	export let isSortable: boolean;
</script>

<th class={$$props.class}>
	{#if $$slots.default}
		<slot
			{column}
			{columnIndex}
			isSorted={lastSortedTitle === column.title}
			{sortDescending}
			sortable={isSortable && column.sortable !== false}
			text={column.title}
		/>
	{:else}
		{column.title}
	{/if}
</th>
