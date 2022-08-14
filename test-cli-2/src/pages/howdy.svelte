<script>
  import Cayo from '#cayo/component';
  // console.log('howdy', Cool);
</script>

howdyyy
<br><a href="/">Back</a>
<Cayo src="../components/test.cayo.svelte" />
<Cayo src={"../components/nested/test.cayo.svelte"} />

<slot name="entry">
  <script src="/main2.js" data-cayo-entry />
</slot>