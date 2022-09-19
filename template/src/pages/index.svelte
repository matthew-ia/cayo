<script>
  import { Cayo, Entry } from 'cayo';
  const heading = '🏝 Cayo Project';
</script>

<h1>{heading}</h1>
<Cayo src="counter.cayo.svelte" />
<Entry src="index.js" />

<style>
  h1 {
    text-align: center;
    font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif
  }
</style>