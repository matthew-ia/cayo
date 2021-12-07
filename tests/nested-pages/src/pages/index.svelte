<script context="module">
  export const meta = {
    title: 'Home',
  };
</script>
<script>
  import Cayo from 'cayo/lib/components/Cayo.svelte';
</script>

I'm index howdy ok<br>
<a href="/some/page/">Go to /some/page/</a><br>

<slot name="entry">
  <script src="/index.js" data-cayo-entry />
</slot>

<style>
</style>