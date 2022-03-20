<script>
  import Cayo from '#cayo/component';
  import Cool from '../components/Cool.cayo.svelte';
  import NotCool from '../components/some/Cool.cayo.svelte';


  // console.log('howdy', Cool);
</script>

howdyyy
<br><a href="/">Back</a>
<Cayo src="../components/Cool.cayo.svelte" />
<Cayo src={"../components/some/Cool.cayo.svelte"} />

<slot name="entry">
  <script src="/main2.js" data-cayo-entry />
</slot>