// Delta App Flow G2: thin reading progress at the very top, driven by CSS scroll() only (no JS,
// no scroll listener). Without scroll-driven support or with reduced motion it stays empty.
export function ScrollProgress() {
  return <div className="scroll-progress" aria-hidden="true" />;
}
