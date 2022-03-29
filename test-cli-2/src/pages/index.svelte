<script context="module">
  export const meta = {
    title: 'Home',
  };
</script>
<script>
  import ComponentA from '../components/b.svelte';
  import ComponentB from '../components/a.svelte';
  import main from '../local.js';
  // import '../styles/yeah.css';
  import data from '../data.json';

  main(data);
</script>

<ComponentA />
<ComponentB />

<span class="red yeah">I'm very cool</span>

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