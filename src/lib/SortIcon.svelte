<script lang="ts">
	export let isSorted: boolean;
	export let sortDescending: boolean;
</script>

<svg
	width="16"
	height="16"
	viewBox="0 0 16 16"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	class="inline"
>
	<path
		d="M8.26186 13.7732C8.11155 13.9034 7.88845 13.9034 7.73814 13.7732L4.4809 10.9524C4.20094 10.7099 4.37241 10.25 4.74276 10.25L11.2572 10.25C11.6276 10.25 11.7991 10.7099 11.5191 10.9524L8.26186 13.7732Z"
		fill="currentColor"
		opacity={isSorted && sortDescending ? 1 : 0.5}
	/>
	<path
		d="M7.73814 2.22678C7.88845 2.09661 8.11155 2.09661 8.26186 2.22678L11.5191 5.04763C11.7991 5.29008 11.6276 5.75 11.2572 5.75H4.74276C4.37241 5.75 4.20094 5.29008 4.4809 5.04763L7.73814 2.22678Z"
		fill="currentColor"
		opacity={isSorted && !sortDescending ? 1 : 0.5}
	/>
</svg>
