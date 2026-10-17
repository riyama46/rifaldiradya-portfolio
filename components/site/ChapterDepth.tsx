// Delta App Flow G2: decorative depth layer of a chapter (dots + one light). Its colour and
// position come from the chapter's data-zone; it lags behind the chapter through CSS view() only.
// Place it as the first child of an element with the `chapter` class.
export function ChapterDepth() {
  return (
    <div className="depth" aria-hidden="true">
      <div className="depth-layer">
        <i className="depth-dots" />
        <i className="depth-glow" />
      </div>
    </div>
  );
}
