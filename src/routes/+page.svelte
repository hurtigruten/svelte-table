<script lang="ts">
	import Table from '../lib/Table.svelte';

	const columns = [
		{ key: (x) => x.name, title: 'Name' },
		{ key: (x) => x.age, title: 'Age' },
		{ key: (x) => x.country, title: 'Country', sortable: false },
		{ key: (x) => x.active, title: 'Active' }
	] as const;

	let rows: Readonly<{ name: string; age: number; country: string; active: boolean }[]> = [
		{ name: 'Bartek', age: 29, country: 'Norway', active: true },
		{ name: 'Tibor', age: 35, country: 'Hungary Some place somewhere', active: false },
		{ name: 'Anna', age: 18, country: 'Poland', active: true },
		{ name: 'Tibor', age: 35, country: 'Hungary Some place somewheres', active: false }
	];

	let sortRowsBy = () => {};
</script>

<h1>Welcome to your library project</h1>
<p>Create your package using @sveltejs/package and preview/showcase your work with SvelteKit</p>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

<button on:click={() => sortRowsBy('Name')}>Sort by name</button>

<!-- export let column: Column<T>;
	export let columnIndex: number;

	export let sortRowsBy: (title: string, force?: boolean) => void;
	export let sortDescending: boolean;
	export let lastSortedTitle: string;
	export let isSortable: boolean; -->

<Table
	{columns}
	{rows}
	rowsPerPage={2}
	on:clickCol={(x) => x.detail}
	--height="50px"
	bind:sortRowsBy
/>
