<script>
  import Cayo from '../../../components/Cayo.svelte';
</script>
I'm index howdy ok<br>
<a href="/howdy/">Howdy</a><br>
<a href="/hey/">Hey</a>
<Cayo name="Cool" beans='beeeeaaaaasnnss' />
<Cayo name="Cool" beans='NOT BEANS' />

<slot name="entry">
  <script src="../main.js" data-cayo-entry />
</slot>