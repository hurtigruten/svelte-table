<script>
  export let activePage;
  export let from;
  export let handleClickPage;
  export let rowsPerPage;
  export let styles;
  export let to;
  export let totalItems;

  let totalPages = 0;

  $: hasMoreItems = from + rowsPerPage < totalItems;
  $: isPrevDisabled = activePage === 1;
  $: isNextDisabled = activePage === totalPages && !hasMoreItems;
  $: totalPages = Math.ceil(totalItems / rowsPerPage);
</script>

<nav
  class={styles.paginationContainer}
  aria-label={`Navigation pagination, showing items ${from} to ${to} of total ${totalItems} items`}
>
  <p class={styles.paginationInfo} aria-hidden="true">
    {`${from}-${to} of ${totalItems}`}
  </p>
  <button
    class={styles.paginationButtons}
    type="button"
    on:click={() => handleClickPage('First', totalPages)}
    tabIndex={isPrevDisabled ? -1 : 0}
    disabled={isPrevDisabled}
    aria-disabled={isPrevDisabled}
    aria-label="First page">First</button
  >
  <button
    class={styles.paginationButtons}
    type="button"
    on:click={() => handleClickPage('Prev', totalPages)}
    tabIndex={isPrevDisabled ? -1 : 0}
    disabled={isPrevDisabled}
    aria-disabled={isPrevDisabled}
    aria-label="Previous page">Prev</button
  >
  <button
    class={styles.paginationButtons}
    type="button"
    on:click={() => handleClickPage('Next', totalPages)}
    tabIndex={isNextDisabled ? -1 : 0}
    disabled={isNextDisabled}
    aria-disabled={isNextDisabled}
    aria-label="Next page">Next</button
  >
  <button
    class={styles.paginationButtons}
    type="button"
    on:click={() => handleClickPage('Last', totalPages)}
    tabIndex={isNextDisabled ? -1 : 0}
    disabled={isNextDisabled}
    aria-disabled={isNextDisabled}
    aria-label="Last page">Last</button
  >
</nav>
