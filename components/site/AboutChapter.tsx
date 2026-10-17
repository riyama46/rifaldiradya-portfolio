import { ChapterDepth } from "@/components/site/ChapterDepth";
import { CvLink } from "@/components/site/CvLink";
import type { Dictionary } from "@/i18n";
import { richText } from "@/i18n/rich";

// Delta APP_FLOW S-01 bab 3. The statement fills in line by line with scroll-driven CSS; without
// support it is plain ink (E-30). Education and certifications stay in the dictionary (D-15).
export function AboutChapter({ dict }: { dict: Dictionary }) {
  const { about } = dict;

  return (
    <section id="about" data-zone="about" aria-labelledby="about-h" className="chapter ch">
      <ChapterDepth />
      <div className="ch-inner">
        <h2 id="about-h" className="ch-label">
          {about.h}
        </h2>
        <p className="statement">
          <span className="fill">{about.s}</span>
        </p>

        <div className="split2">
          <div className="about-body">
            <p>{about.p1}</p>
            <p>{about.p2}</p>
          </div>
          <div className="facts">
            <h3 className="ch-label">{about.edu}</h3>
            <ul>
              {about.education.map((line) => (
                <li key={line}>{richText(line)}</li>
              ))}
            </ul>
            <h3 className="ch-label">{about.cert}</h3>
            <ul>
              {about.certs.map((line) => (
                <li key={line}>{richText(line)}</li>
              ))}
            </ul>
            <p>
              <CvLink dict={dict} location="about" />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
