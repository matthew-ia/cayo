<script context="module">
  export const meta = {
    title: 'Home',
  };
</script>
<script>
  import ComponentA from '../components/b.svelte';
  import ComponentB from '../components/a.svelte';
</script>

<ComponentA />
<ComponentB />

<span class="red">I'm very cool</span>

<img src="/images/app-icon.png" alt="">

<slot name="entry">
  <script src="/index.js" data-cayo-entry />
</slot>

<style>
  .red {
    color: red;
  }
  img {
    width: 50px;
  }
</style>