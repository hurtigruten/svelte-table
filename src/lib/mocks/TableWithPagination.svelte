<script>
  import Table from '../SvelteTable.svelte';

  const columns = [
    { key: 'name', title: 'Name' },
    { key: 'location', title: 'Location' },
    { key: 'age', title: 'Age' }
  ];

  const rows = [
    {
      location: 'Oslo',
      name: 'Bartek',
      age: 28,
      active: true
    },
    {
      location: 'Berlin',
      age: 31,
      name: 'Adam',
      active: false
    },
    {
      name: 'John',
      location: 'NYC',
      age: 10,
      active: false
    },
    {
      name: 'David',
      location: 'Copenhagen',
      age: 99,
      active: true
    },
    {
      location: 'Warsaw',
      name: 'Darren',
      age: 32,
      active: false
    },
    {
      location: 'Barcelona',
      name: 'Mannuel',
      age: 38,
      active: true
    },
    {
      location: 'London',
      name: 'Stephen',
      age: 45,
      active: true
    }
  ];
</script>

<Table {columns} {rows} rowsPerPage={2} />
