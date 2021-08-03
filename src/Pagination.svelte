<script>
  export let activePage = 1;
  export let from = 0;
  export let rowsPerPage;
  export let styles;
  export let to = 0;
  export let totalItems;
  export let rows;

  let totalPages = 0;

  const handleClickPage = (direction, totalPages) => {
    switch (direction) {
      case 'First':
        activePage = 1;
        break;
      case 'Prev':
        activePage = activePage !== 1 ? (activePage -= 1) : 1;
        break;
      case 'Next':
        activePage = activePage !== totalPages ? (activePage += 1) : totalPages;
        break;
      case 'Last':
        activePage = totalPages;
        break;
      default:
        return;
    }
  };

  $: hasMoreItems = from + rowsPerPage < totalItems;
  $: isPrevDisabled = activePage === 1 || !rows.length;
  $: isNextDisabled =
    (activePage === totalPages && !hasMoreItems) || !rows.length;
  $: totalPages = Math.ceil(totalItems / rowsPerPage);
  $: from =
    activePage === 1
      ? rows.length
        ? 1
        : 0
      : (activePage - 1) * rowsPerPage + 1;
  $: to =
    activePage * rowsPerPage > totalItems
      ? totalItems
      : activePage * rowsPerPage;
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
