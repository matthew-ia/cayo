<script>
  import Other from './nested/c.svelte';
</script>
<span class="some">I'm a working dependency</span>
<Other/>

<style>
  .some {
    color: yellow;
  }
</style>