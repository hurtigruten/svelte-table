<div class="base">
	<nav class="nav">
		<h1>Hurtigruten's Svelte Table</h1>
		<a href="https://github.com/hurtigruten/svelte-table">GitHub</a>
		<a href="https://www.npmjs.com/package/@hurtigruten/svelte-table">NPM</a>
		<ul>
			<li>
				<h5>Getting started</h5>
				<ul>
					<li>
						<a href="/getting-started/introduction/">Introduction</a>
					</li>
					<li>
						<a href="/getting-started/quick-start">Quick start</a>
					</li>
				</ul>
			</li>
			<li>
				<h5>Guides</h5>
				<ul>
					<li>
						<a href="/guides/simple-usage">Simple usage</a>
					</li>
					<li>
						<a href="/guides/types">Types</a>
					</li>
					<li>
						<a href="/guides/events">Events</a>
					</li>
					<li>
						<a href="/guides/customization">Customization and CSS</a>
					</li>
					<li>
						<a href="/guides/pagination">Pagination</a>
					</li>
				</ul>
			</li>
			<li>
				<h5>Examples</h5>
				<ul>
					<li>
						<a href="/examples/static">Static data</a>
					</li>
					<li>
						<a href="/examples/sorting">Sorting</a>
					</li>
					<li>
						<a href="/examples/slots">Slots</a>
					</li>
					<li>
						<a href="/examples/customization">Customization</a>
					</li>
					<li>
						<a href="/examples/pagination">Pagination</a>
					</li>
				</ul>
			</li>
		</ul>
	</nav>
	<main class="main">
		<div class="container">
			<slot />
		</div>
	</main>
</div>

<style>
	.base {
		display: flex;
	}

	h1 {
		font-size: 1rem;
	}

	.nav {
		padding: 1rem;
		position: sticky;
		top: 0;
		bottom: 0;
		height: 100vh;
		width: max-content;
		margin-right: 2rem;
		background: #232323;
		color: white;
	}

	.nav > ul > li {
		border-top: 1px solid lightgray;
		margin-top: 2rem;
	}

	.nav ul {
		padding: 0;
		margin: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.nav a {
		color: inherit;
	}

	.main {
		min-height: 200vh;
	}

	:global(.container) {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	:global(pre) {
		padding: 0.5rem;
		background-color: black;
		font-size: 1rem;

		color: rgba(200, 255, 200);
	}

	:global(code) {
		background-color: #fafafa;
		padding: 0.5rem;
		display: inline-block;
	}

	:global(p) {
		max-width: 60ch;
	}

	:global(body) {
		font-family: sans-serif;
		padding: 0;
		margin: 0;
	}
</style>
