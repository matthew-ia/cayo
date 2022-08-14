<script>
  import Cayo from 'cayo/component/index.js';
  // console.log('howdy', Cool);
</script>

howdyyy
<br><a href="/">Back</a>
<Cayo src="../components/Cool.cayo.svelte" />
<Cayo src={"../components/some/Cool.cayo.svelte"} />
<Cayo src={"../components/some/Cool.cayo.svelte"} />

<slot name="entry">
  <script src="/main2.js" data-cayo-entry />
</slot>