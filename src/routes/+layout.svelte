<div class="base">
	<nav class="nav">
		<ul>
			<li>
				<h5>Getting started</h5>
				<ul>
					<li>
						<a href="/">Introduction</a>
					</li>
					<li>
						<a href="/">Quick start</a>
					</li>
				</ul>
			</li>
			<li>
				<h5>Guides</h5>
				<ul>
					<li>
						<a href="/">Simple usage</a>
					</li>
					<li>
						<a href="/">Types</a>
					</li>
					<li>
						<a href="/">Events</a>
					</li>
					<li>
						<a href="/">Customization and CSS</a>
					</li>
					<li>
						<a href="/">Pagination</a>
					</li>
				</ul>
			</li>
			<li>
				<h5>Examples</h5>
				<ul>
					<li>
						<a href="/">Static data</a>
					</li>
					<li>
						<a href="/">Sorting</a>
					</li>
					<li>
						<a href="/">Slots</a>
					</li>
					<li>
						<a href="/">Customization</a>
					</li>
					<li>
						<a href="/">Pagination</a>
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

	.nav {
		position: sticky;
		bottom: 0;
		height: 100vh;
		width: max-content;
		margin-right: 2rem;
	}

	.main {
		min-height: 200vh;
	}

	:global(.container) {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}
</style>
