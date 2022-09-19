<script>
  export let count = 0;
</script>

<div class="wrapper">
  <button on:click={() => count++}>Count: {count}</button>
</div>

<style>
  .wrapper {
    display: flex;
    justify-content: center;
  }
  button {
    padding: .5rem;
    background-color: transparent;
    border: 1px solid rgba(81, 95, 240, .75);
    color: white;
    border-radius: 5px;
    transition: .2s;
  }
  button:hover {
    cursor: pointer;
    border-color: rgb(81, 95, 240);
    background-color: rgba(81, 95, 240, .25);
  }
</style>