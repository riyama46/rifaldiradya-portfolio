"use client";

import Image from "next/image";
import { useState } from "react";
import {
  previewOf,
  type FormValues,
  type PreviewLanguage,
} from "@/components/admin/project-form-model";
import { SegmentedControl } from "@/components/admin/SegmentedControl";
import { adminStrings } from "@/components/admin/strings";

const t = adminStrings.form.preview;
const LANGUAGES = ["en", "id"] as const satisfies readonly PreviewLanguage[];

const heading = "text-small font-medium text-text-muted";

/**
 * S-12/S-13 preview panel (CHANGE v2.1.0 Scope, admin.html .side): Selected work and the cursor
 * preview for the unsaved values, updated while typing (AC-7). Only at 1024 px and up; EN first,
 * with a switch to ID.
 */
export function ProjectPreview({ values }: { values: FormValues }) {
  const [lang, setLang] = useState<PreviewLanguage>("en");
  const { label, title, summary, visual } = previewOf(values, lang);

  return (
    <aside aria-label={t.label} className="sticky top-21 hidden gap-3.5 lg:grid">
      <span id="preview-language" className="sr-only">
        {t.language}
      </span>
      <SegmentedControl
        id="preview-language-en"
        labelledBy="preview-language"
        options={LANGUAGES.map((value) => ({ value, label: t.languages[value] }))}
        value={lang}
        onChange={setLang}
      />

      <h2 className={heading}>{t.home}</h2>
      <div lang={lang} className="rounded-card border border-border bg-surface p-5">
        {label && (
          <p className="text-[0.75rem] tracking-[0.12em] text-text-muted uppercase">{label}</p>
        )}
        <p className="mt-2.5 text-heading leading-none font-semibold tracking-[-0.035em] break-words">
          {title || <span className="text-text-muted">{t.untitled}</span>}
        </p>
        {summary && <p className="mt-2.5 text-small text-text-muted">{summary}</p>}
      </div>

      <h2 className={heading}>{t.cursor}</h2>
      {visual?.type === "number" ? (
        // Same look as the site's .peek-card.
        <div
          lang={lang}
          className="flex aspect-[16/10] flex-col justify-end rounded-card bg-[color-mix(in_srgb,var(--accent)_16%,var(--bg))] p-5"
        >
          <b className="text-[2.5rem] leading-none font-medium tracking-[-0.03em] tabular-nums">
            {visual.number}
          </b>
          <span className="mt-1.5 text-small text-text-muted">{visual.caption}</span>
        </div>
      ) : visual ? (
        <div className="aspect-[16/10] overflow-hidden rounded-card">
          {/* Decorative here: the screenshot and its alt text are edited in the Visual section. */}
          <Image
            src={visual.url}
            width={visual.width}
            height={visual.height}
            sizes="340px"
            alt=""
            className="size-full object-cover object-top"
          />
        </div>
      ) : (
        <p className="grid aspect-[16/10] place-items-center rounded-card border border-dashed border-border p-5 text-center text-small text-text-muted">
          {t.noVisual}
        </p>
      )}
    </aside>
  );
}
