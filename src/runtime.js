
export function getProps(cayoId) {
  const componentElement = document.querySelector(`[data-cayo-id="${cayoId}"]`);
  const json = '' + componentElement.dataset.cayoProps;
  return JSON.parse(json);
}