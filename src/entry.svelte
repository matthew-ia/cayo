<script>
  export let src = "entry.js";
</script>
<slot>
  <script src="{src}" data-cayo-entry />
</slot>