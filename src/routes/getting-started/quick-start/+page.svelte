<h1>Quick Start</h1>
<p>Hurtigruten's Svelte Table is easy to setup with just a few steps</p>

<h2>Install</h2>
<p>Use a package manager of choice and install the package as your project's dependency</p>
<pre>npm install @hurtigruten/svelte-table</pre>

<p>
	Once you have the package installed all you need to do is import the Table component in your
	.svelte file
</p>
<pre>import {`{`} Table {`}`} from '@hurtigruten/svelte-table'</pre>

<p>
	And in order to display some data you will need to pass it a dataset called rows and a definition
	of columns
</p>
<pre>
const rows = [
  {`{`}name: "Adam", age: 20{`}`},
  {`{`}name: "Eva", age: 21{`}`}
  ];

const columns = [
  {`{`}title: "Name", content: x => x.name{`}`},
  {`{`}title: "Age", content: x => x.age{`}`}
  ];

</pre>

<p>
	Mark that your
	<code>content</code>
	property in column definition needs to be a predicate.
</p>
<p>
	This helps the table figure out what type it is expecting, and handle the sorting out-of-the-box
</p>

<p>Now all you need to do is pass these as props to your component</p>
<pre>
{`<`}Table {`{`}rows{`}`} {`{`}columns{`}`} {`/>`}
</pre>
