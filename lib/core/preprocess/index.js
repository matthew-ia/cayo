import path from 'path';
import { JSDOM } from 'jsdom';

// Transformers

export default function preprocess(config) {

  // console.log('===== preprocessing... ', sourcePath.split('/').pop());
  const script = (input) => {
    // console.log('======== script... ', sourcePath.split('/').pop());
    return scriptPreprocessor(input, config); 
  }

  const markup = (input) => {
    // console.log('======== markup... ', sourcePath.split('/').pop());
    return markupPreprocessor(input, config);
  }

  return {
    // script,
    // markup,
  }
}

function scriptPreprocessor(input, config) {
  // preprocessor function args (svelte.preprocess API)
  const { content, filename } = input;
  let newContent = content;
  return {
    code: newContent,
  }
}

function markupPreprocessor(input, config) {
  // preprocessor function args (svelte.preprocess)
  const { content, filename } = input;
  let newContent;
  return {
    code: newContent,
  }
}
