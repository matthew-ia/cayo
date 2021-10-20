<script context="module">
  export const meta = {
    title: 'Home',
  };
</script>
<script>
  import Cayo from '../../../components/Cayo.svelte';
</script>

I'm index howdy ok<br>
<a href="/howdy/">Howdy</a><br>
<a href="/hey/" class="red">Hey</a>

<Cayo name="Cool" beans='ayo'></Cayo>
<Cayo name="Cool" beans='beeeeaaaaasnnss' />
<Cayo name="Cool" beans='NOT BEANS' />

<img src="/app-icon.png" alt="">

<slot name="entry">
  <script src="../main.js" data-cayo-entry />
</slot>

<style>
  .red {
    color: red;
  }
</style>