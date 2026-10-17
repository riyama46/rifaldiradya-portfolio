import type { CSSProperties, ReactNode } from "react";
import { ChapterDepth } from "@/components/site/ChapterDepth";
import type { Dictionary } from "@/i18n";
import { richText } from "@/i18n/rich";

/** A number that counts from `from` to `to` in CSS; its final value is set when nothing animates. */
function Count({ from, to }: { from: number; to: number }) {
  return <i className="num" style={{ "--from": from, "--to": to } as CSSProperties} />;
}

function Stat({ value, label, children }: { value: string; label: string; children: ReactNode }) {
  return (
    <p>
      <b>
        <span className="sr-only">{value}</span>
        <span aria-hidden="true">{children}</span>
      </b>
      <span>{label}</span>
    </p>
  );
}

// Delta APP_FLOW S-01 bab 4. "five passwords" is struck out and the numbers count up through
// scroll-driven CSS; screen readers and browsers without support get the final values (E-30).
export function HighlightChapter({ dict }: { dict: Dictionary }) {
  const c = dict.case;

  return (
    <section id="highlight" data-zone="highlight" aria-labelledby="case-h" className="chapter ch">
      <ChapterDepth />
      <div className="ch-inner">
        <p className="ch-label">{c.meta}</p>
        <h2 id="case-h" className="statement strike">
          {richText(c.t)}
        </h2>

        <div className="stats">
          <Stat value="5 → 1" label={c.st1}>
            5 → <Count from={5} to={1} />
          </Stat>
          <Stat value={c.st2n} label={c.st2}>
            {c.st2p}
            <Count from={0} to={200} />
          </Stat>
          <Stat value="13" label={c.st3}>
            <Count from={0} to={13} />
          </Stat>
        </div>

        <p className="note">{c.blur}</p>
        <p className="bridge">
          <span>{dict.bridge.q}</span>{" "}
          <a href="#contact" className="line-link">
            {dict.bridge.go}
          </a>
        </p>
      </div>
    </section>
  );
}
