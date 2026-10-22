// D-37: one dot field behind the whole page, so the pattern runs on across chapter edges. Fixed and
// slightly taller than the screen; it drifts through CSS scroll(root) only (no JS, no listener).
export function DotField() {
  return <div className="dot-field" aria-hidden="true" />;
}
