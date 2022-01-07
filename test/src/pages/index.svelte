<script context="module">
  export const meta = {
    title: 'Home',
  };
</script>
<script>
  import Cayo from '../../../lib/components/Cayo.svelte';

  import Some from '../components/Some.svelte';
</script>

<Some />

I'm index howdy ok<br>
<a href="/howdy/">Howdy</a><br>
<a href="/hey/" class="red">Hey</a>
<a href="/some/page/" class="red">Some</a>

<Cayo name="Cool" beans='ayo'>Whaaat</Cayo>
<Cayo name="Cool" beans='beeeeaaaaasnnss' />
<Cayo name="Cool" beans='NOT BEANS' />

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