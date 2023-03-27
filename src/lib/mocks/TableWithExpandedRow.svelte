<script>
	import Table from '../Table.svelte';

	const columns = [
		{ key: 'name', title: 'Name' },
		{ key: 'location', title: 'Location' },
		{ key: 'age', title: 'Age' }
	];

	const rows = [
		{
			location: 'Oslo',
			name: 'Bartek',
			age: 28,
			active: true
		},
		{
			location: 'Berlin',
			age: 31,
			name: 'Adam',
			active: false
		},
		{
			name: 'John',
			location: 'NYC',
			age: 10,
			active: false
		},
		{
			name: 'David',
			location: 'Copenhagen',
			age: 99,
			active: true
		}
	];
</script>

<Table {columns} {rows} let:cell let:handleExpand let:row>
	<span slot="cell" on:click={handleExpand}>{cell}</span>
	<td colspan="3" slot="expanded">
		{#if row.active}
			User is active
		{:else}
			User is inactive
		{/if}
	</td>
</Table>
