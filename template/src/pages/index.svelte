<script>
  import { Cayo, Entry } from 'cayo';
  import Counter from '../components/counter.cayo.svelte';
  const heading = '🏝 Cayo';
</script>

<h1>{heading}</h1>

<p>Example with component import (recommended):</p>
<Cayo component={Counter} />

<p>Example with string path (classic):</p>
<Cayo src="counter.cayo.svelte" />

<Entry />

<style>
  h1 {
    text-align: center;
    font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
  p {
    text-align: center;
    color: #888;
    font-size: 0.9rem;
    margin: 1rem 0 0.5rem 0;
  }
</style>