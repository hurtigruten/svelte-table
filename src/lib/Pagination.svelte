<script lang="ts">
	export let to: number;
	export let from: number;
	export let nextPage: () => void;
	export let prevPage: () => void;
	export let firstPage: () => void;
	export let lastPage: () => void;
	export let totalItems: number;
	export let enabled: {
		prevPage: boolean;
		firstPage: boolean;
		nextPage: boolean;
		lastPage: boolean;
	};
</script>

<nav
	class="hrg-table__nav"
	aria-label={`Navigation pagination, showing items ${from} to ${to} of total ${totalItems} items`}
>
	<button
		class="hrg-table__nav-btn"
		type="button"
		on:click={firstPage}
		disabled={!enabled.firstPage}
		aria-disabled={!enabled.firstPage}
		aria-label="First page">First</button
	>
	<button
		class="hrg-table__nav-btn"
		type="button"
		on:click={prevPage}
		disabled={!enabled.prevPage}
		aria-disabled={!enabled.prevPage}
		aria-label="Previous page"
		data-testid="previous-button">Prev</button
	>
	<p class="hrg-table__nav-info" aria-hidden="true">
		{`${from}-${to} of ${totalItems}`}
	</p>
	<button
		class="hrg-table__nav-btn"
		type="button"
		on:click={nextPage}
		disabled={!enabled.nextPage}
		aria-disabled={!enabled.nextPage}
		aria-label="Next page"
		data-testid="next-button">Next</button
	>
	<button
		class="hrg-table__nav-btn"
		type="button"
		on:click={lastPage}
		disabled={!enabled.lastPage}
		aria-disabled={!enabled.lastPage}
		aria-label="Last page">Last</button
	>
</nav>

<style>
	nav {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
</style>
