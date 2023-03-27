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
			age: 28
		},
		{
			location: 'Berlin',
			age: 31,
			name: 'Adam'
		},
		{
			name: 'John',
			location: 'NYC',
			age: 10
		},
		{
			name: 'David',
			location: 'Copenhagen',
			age: 99
		}
	];
</script>

<Table
	{columns}
	{rows}
	classes={{
		'tr-odd': 'bg-white',
		'tr-even': 'bg-black'
	}}
/>
