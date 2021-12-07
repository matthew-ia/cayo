<script>
  import CayoExample from '../components/CayoExample.svelte';
</script>

<p>
  howdy pardner.<br>
</p>
<CayoExample />

<slot name="entry">
  <script src="/index.js" data-cayo-entry />
</slot>