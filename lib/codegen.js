import path from 'path';

// Generate runtime helper that finds and parses a component instance's prop data
export function generateGetProps() {
  return (
`
function getProps(cayoId) {
  const componentElement = document.querySelector(\`[data-cayo-id="\${cayoId}"]\`);
  const json = componentElement.dataset.cayoProps;
  return JSON.parse(json);
}
`
  );
}

export function generateCayoRuntime(components, config) {
  let code = '';
  let instances = '';

  if (Object.keys(components).length !== 0) {
    // TODO: add this path to config (internal only)
    // const componentPath = path.resolve(config.cayoPath, './__cayo/components');
    const componentPath = '/__cayo/components';
    Object.entries(components).forEach(([name, ids]) => {
      // Add component dependency import
      code += `import { ${name} } from '${componentPath}/${name}.js';\n`;
      // Generate component instances
      ids.forEach(id => {
        instances += generateComponentInstance(id, name)
      });
    });
    
    // Add getProps (used by component instances)
    code += generateGetProps();
  } else {
    instances += `  // No cayo component instances found in page HTML`;
  }

  // Add main render, which runs the component instantiations
  code += generateRender(instances);

  return { code };
}

function generateRender(contents) {
  return (
`
export default function render() {
${contents}
}
`
  );
}

// Generate the code to wrap component instances in an event listener wrapper
export function generateComponentInstanceWrapper(contents) {
  return (
`
document.addEventListener('DOMContentLoaded', function() {
${contents}
});
`
  );
}

// Generate the code for a component instance
export function generateComponentInstance(cayoId, componentName) {
  return (
` 
  new ${componentName}({
    target: document.querySelector('[data-cayo-id="${cayoId}"]'),
    hydrate: true,
    props: getProps('${cayoId}'),
  });
`
  );
}