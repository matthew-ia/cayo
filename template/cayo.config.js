import { cayoPreprocess } from 'cayo/build';

export default {
  svelte: {
    preprocess: [
      cayoPreprocess(),
      // Add other preprocessors here as needed
    ]
  }
  // Add other options as needed...
}