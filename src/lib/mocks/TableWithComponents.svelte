<script>
	import Table from '../Table.svelte';

	export let empty;

	const columns = [
		{ key: 'name', title: 'Name' },
		{ key: 'location', title: 'Location' },
		{ key: 'age', title: 'Age' }
	];

	const dryRows = [{ id: 11 }, { id: 12 }, { id: 13 }];

	const rows = [
		{
			id: 11,
			location: 'Oslo',
			name: 'Bartek',
			age: 28,
			active: true
		},
		{
			id: 12,
			location: 'Berlin',
			age: 31,
			name: 'Adam',
			active: false
		},
		{
			id: 13,
			name: 'John',
			location: 'NYC',
			age: 10,
			active: false
		}
	];
</script>

<Table {columns} rows={empty ? [] : dryRows} let:column let:row>
	<span slot="head" data-testid="custom">{column.title.toUpperCase()}</span>
	<span slot="cell" data-testid="custom">{rows.find((x) => row.id === x.id)[column.key]}</span>
	<span slot="empty">This table is empty 💩</span>
</Table>
