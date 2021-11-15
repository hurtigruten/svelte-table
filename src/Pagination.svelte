<script>
  export let classes = {
    paginationContainer: '',
    paginationInfo: '',
    paginationButtons: ''
  };
  export let to;
  export let from;
  export let nextPage;
  export let prevPage;
  export let firstPage;
  export let lastPage;
  export let totalItems;
  export let enabled;
</script>

<nav
  class={classes.paginationContainer}
  aria-label={`Navigation pagination, showing items ${from} to ${to} of total ${totalItems} items`}
>
  <button
    class={classes.paginationButtons}
    type="button"
    on:click={firstPage}
    disabled={!enabled.firstPage}
    aria-disabled={!enabled.firstPage}
    aria-label="First page">First</button
  >
  <button
    class={classes.paginationButtons}
    type="button"
    on:click={prevPage}
    disabled={!enabled.prevPage}
    aria-disabled={!enabled.prevPage}
    aria-label="Previous page"
    data-testid="previous-button">Prev</button
  >
  <p class={classes.paginationInfo} aria-hidden="true">
    {`${from}-${to} of ${totalItems}`}
  </p>
  <button
    class={classes.paginationButtons}
    type="button"
    on:click={nextPage}
    disabled={!enabled.nextPage}
    aria-disabled={!enabled.nextPage}
    aria-label="Next page"
    data-testid="next-button">Next</button
  >
  <button
    class={classes.paginationButtons}
    type="button"
    on:click={lastPage}
    disabled={!enabled.lastPage}
    aria-disabled={!enabled.lastPage}
    aria-label="Last page">Last</button
  >
</nav>
