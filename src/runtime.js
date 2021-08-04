
export function getProps(cayoId) {
  const json = document.querySelector(`[data-cayo-data-for="${cayoId}"]`).textContent;
  return JSON.parse(json);
}