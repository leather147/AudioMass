export const EDITOR_TOOL_ROUTES = {
  eq: '/tools/frequency-analyser',
  mix: '/tools/multitrack-mixer',
  sp: '/tools/spectral-analyser',
} as const;

export type EditorToolId = keyof typeof EDITOR_TOOL_ROUTES;

export function editorToolRoute(tool: EditorToolId, embedded = false) {
  const route = EDITOR_TOOL_ROUTES[tool];
  return embedded ? `${route}?embedded=1` : route;
}
