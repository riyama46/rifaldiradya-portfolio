"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ImageUploader } from "@/components/admin/ImageUploader";
import {
  addTags,
  firstErrorField,
  isDirty,
  toPayload,
  validate,
  type FieldErrors,
  type FormValues,
} from "@/components/admin/project-form-model";
import { adminStrings, type NoticeKey } from "@/components/admin/strings";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { Toggle } from "@/components/ui/Toggle";
import { cn } from "@/lib/cn";
import {
  ALT_MAX,
  fieldLabels,
  LIVE_URL_MAX,
  SUMMARY_MAX,
  TITLE_MAX,
  type ProjectField,
} from "@/lib/projects/validation";

const t = adminStrings.form;

const inputClass =
  "w-full rounded-button border bg-surface-raised px-3.5 py-3 text-base text-text outline-none transition-colors focus-visible:border-accent";

type ProjectFormProps =
  | { mode: "create"; initial: FormValues }
  | { mode: "edit"; initial: FormValues; projectId: string; savedPublicId: string | null };

type ApiErrorBody = { error?: { code?: string; fields?: FieldErrors } };

function describedBy(field: ProjectField, errors: FieldErrors, hasHelp: boolean) {
  const ids = [hasHelp && `${field}-help`, errors[field] && `${field}-error`].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

function Field({
  field,
  errors,
  help,
  counter,
  children,
}: {
  field: ProjectField;
  errors: FieldErrors;
  help?: string;
  counter?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={field} className="text-small font-medium">
          {fieldLabels[field]}
        </label>
        {counter}
      </div>
      {children}
      {help && (
        <p id={`${field}-help`} className="text-small text-text-muted">
          {help}
        </p>
      )}
      {errors[field] && (
        <p id={`${field}-error`} className="text-small font-medium text-danger">
          {errors[field]}
        </p>
      )}
    </div>
  );
}

function Counter({ value, max }: { value: string; max: number }) {
  const over = value.trim().length > max;
  return (
    <span
      aria-hidden="true"
      className={cn("text-small tabular-nums", over ? "text-danger" : "text-text-muted")}
    >
      {t.counter(value.trim().length, max)}
    </span>
  );
}

/**
 * S-12 / S-13 (App Flow section 6, UF-07…UF-10). The shared Zod schema validates on blur and
 * before submit; the server validates again and its field errors are shown the same way.
 */
export function ProjectForm(props: ProjectFormProps) {
  const router = useRouter();
  const { initial } = props;
  const savedPublicId = props.mode === "edit" ? props.savedPublicId : null;

  const [values, setValues] = useState<FormValues>(initial);
  const [touched, setTouched] = useState<Partial<Record<ProjectField, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [summary, setSummary] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const [tagDraft, setTagDraft] = useState("");
  const [tagError, setTagError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"discard" | "delete" | null>(null);
  const [deleting, setDeleting] = useState(false);
  const leaving = useRef(false);

  const dirty = isDirty(initial, values);
  const clientErrors = validate(values);
  // Client errors show once a field was left (blur) or after the first submit; server errors
  // show until that field changes.
  const errors: FieldErrors = { ...serverErrors };
  for (const [field, message] of Object.entries(clientErrors) as [ProjectField, string][]) {
    if (submitted || touched[field]) errors[field] ??= message;
  }
  if (tagError) errors.tags = tagError;

  // Browser navigation away with unsaved changes (App Flow S-12).
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (leaving.current) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function set<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setServerErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field as ProjectField];
      return next;
    });
  }

  const blur = (field: ProjectField) => () =>
    setTouched((current) => ({ ...current, [field]: true }));

  function leave(notice?: NoticeKey) {
    leaving.current = true;
    router.push(notice ? `/admin?notice=${notice}` : "/admin");
  }

  function focusField(field: ProjectField) {
    document.getElementById(field)?.focus();
  }

  function showErrors(next: FieldErrors) {
    setSummary(true);
    const first = firstErrorField(next);
    // Every field input is already rendered (alt fields only exist with a thumbnail, and then
    // they are too), so focus can move right away; no animation frame, which a hidden tab skips.
    if (first) focusField(first);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || uploading) return;
    setSubmitted(true);
    setSessionExpired(false);

    if (Object.keys(clientErrors).length > 0) {
      showErrors(clientErrors);
      return;
    }

    setSaving(true);
    const url =
      props.mode === "create" ? "/api/admin/projects" : `/api/admin/projects/${props.projectId}`;
    try {
      const response = await fetch(url, {
        method: props.mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(values)),
      });

      if (response.ok) {
        const body = (await response.json()) as { revalidated?: boolean };
        leave(
          body.revalidated === false
            ? "saved-stale"
            : props.mode === "create"
              ? "created"
              : "saved",
        );
        return;
      }

      const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
      if (response.status === 401) {
        setSessionExpired(true); // E-11: keep every input, sign in elsewhere, save again
      } else if (response.status === 404) {
        leave("gone"); // E-14
        return;
      } else if (response.status === 422 && body.error?.fields) {
        setServerErrors(body.error.fields);
        showErrors(body.error.fields);
      } else {
        setToast({ id: Date.now(), message: t.saveFailed }); // E-13
      }
    } catch {
      setToast({ id: Date.now(), message: t.saveFailed });
    }
    setSaving(false);
  }

  function onCancel() {
    if (dirty) setDialog("discard");
    else leave();
  }

  function discardChanges() {
    const upload = values.thumbnail?.public_id;
    if (upload && upload !== savedPublicId) {
      void fetch(`/api/admin/uploads/${encodeURIComponent(upload)}`, { method: "DELETE" }).catch(
        () => undefined,
      );
    }
    leave();
  }

  async function deleteProject() {
    if (props.mode !== "edit") return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/projects/${props.projectId}`, { method: "DELETE" });
      if (response.ok || response.status === 404) {
        leave(response.ok ? "deleted" : "gone");
        return;
      }
      setDialog(null);
      if (response.status === 401) setSessionExpired(true);
      else setToast({ id: Date.now(), message: t.danger.failed });
    } catch {
      setDialog(null);
      setToast({ id: Date.now(), message: t.danger.failed });
    }
    setDeleting(false);
  }

  function commitTags(raw: string) {
    const result = addTags(values.tags, raw);
    set("tags", result.tags);
    setTagError(result.error);
    setTagDraft(result.error ? raw.trim() : "");
  }

  function onTagKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitTags(tagDraft);
    } else if (event.key === "Backspace" && tagDraft === "" && values.tags.length > 0) {
      set("tags", values.tags.slice(0, -1));
      setTagError(null);
    }
  }

  const text = (
    field:
      | "title_en"
      | "title_id"
      | "summary_en"
      | "summary_id"
      | "live_url"
      | "thumbnail_alt_en"
      | "thumbnail_alt_id",
  ) => ({
    id: field,
    name: field,
    value: values[field],
    onChange: (event: { target: { value: string } }) => set(field, event.target.value),
    onBlur: blur(field),
    "aria-invalid": errors[field] ? true : undefined,
    className: cn(inputClass, errors[field] ? "border-danger" : "border-border"),
  });

  const errorList = (Object.entries(errors) as [ProjectField, string][]).sort(
    ([a], [b]) => Object.keys(fieldLabels).indexOf(a) - Object.keys(fieldLabels).indexOf(b),
  );

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="grid gap-8">
        {sessionExpired && (
          <p
            role="alert"
            className="rounded-button border-l-4 border-l-accent bg-accent-soft px-4 py-3"
          >
            {t.sessionExpired}{" "}
            <a
              href="/admin/login"
              target="_blank"
              rel="noopener"
              className="font-medium underline decoration-accent decoration-2 underline-offset-4"
            >
              {t.signInLink}
            </a>
          </p>
        )}

        {summary && errorList.length > 0 && (
          <div
            role="alert"
            className="rounded-card border border-l-4 border-border border-l-danger bg-surface-raised p-4"
          >
            <p className="font-medium">{t.errorSummary}</p>
            <ul className="mt-2 grid gap-1 text-small">
              {errorList.map(([field, message]) => (
                <li key={field}>
                  <a
                    href={`#${field}`}
                    onClick={(event) => {
                      event.preventDefault();
                      focusField(field);
                    }}
                    className="underline decoration-danger underline-offset-4"
                  >
                    {message.startsWith(fieldLabels[field])
                      ? message
                      : `${fieldLabels[field]}: ${message}`}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Field
            field="title_en"
            errors={errors}
            counter={<Counter value={values.title_en} max={TITLE_MAX} />}
          >
            <input
              {...text("title_en")}
              aria-describedby={describedBy("title_en", errors, false)}
            />
          </Field>
          <Field
            field="title_id"
            errors={errors}
            counter={<Counter value={values.title_id} max={TITLE_MAX} />}
          >
            <input
              {...text("title_id")}
              aria-describedby={describedBy("title_id", errors, false)}
            />
          </Field>
          <Field
            field="summary_en"
            errors={errors}
            help={t.help.summary_en}
            counter={<Counter value={values.summary_en} max={SUMMARY_MAX} />}
          >
            <textarea
              rows={3}
              {...text("summary_en")}
              aria-describedby={describedBy("summary_en", errors, true)}
            />
          </Field>
          <Field
            field="summary_id"
            errors={errors}
            counter={<Counter value={values.summary_id} max={SUMMARY_MAX} />}
          >
            <textarea
              rows={3}
              {...text("summary_id")}
              aria-describedby={describedBy("summary_id", errors, false)}
            />
          </Field>
        </div>

        <Field field="live_url" errors={errors} help={t.help.live_url}>
          <input
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://"
            maxLength={LIVE_URL_MAX + 20}
            {...text("live_url")}
            aria-describedby={describedBy("live_url", errors, true)}
          />
        </Field>

        <Field field="tags" errors={errors} help={t.help.tags}>
          <div
            className={cn(
              "flex flex-wrap items-center gap-2 rounded-button border bg-surface-raised px-2 py-2 focus-within:border-accent",
              errors.tags ? "border-danger" : "border-border",
            )}
          >
            {values.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-accent-soft py-1 pr-1 pl-3 text-small"
              >
                {tag}
                <button
                  type="button"
                  aria-label={t.removeTag(tag)}
                  onClick={() => {
                    set(
                      "tags",
                      values.tags.filter((item) => item !== tag),
                    );
                    setTagError(null);
                  }}
                  className="grid size-7 cursor-pointer place-items-center rounded-full hover:bg-surface"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </span>
            ))}
            <input
              id="tags"
              value={tagDraft}
              onChange={(event) => {
                setTagDraft(event.target.value);
                setTagError(null);
              }}
              onKeyDown={onTagKey}
              onBlur={() => {
                if (tagDraft.trim()) commitTags(tagDraft);
                blur("tags")();
              }}
              aria-invalid={errors.tags ? true : undefined}
              aria-describedby={describedBy("tags", errors, true)}
              className="min-w-40 flex-1 bg-transparent px-1.5 py-1.5 text-base outline-none"
            />
          </div>
        </Field>

        {/* A group label, not <label htmlFor>: that would rename the "Replace" button "Thumbnail". */}
        <div role="group" aria-labelledby="thumbnail-label" className="grid gap-1.5">
          <p id="thumbnail-label" className="text-small font-medium">
            {fieldLabels.thumbnail}
          </p>
          <ImageUploader
            id="thumbnail"
            value={values.thumbnail}
            savedPublicId={savedPublicId}
            onChange={(image) => {
              set("thumbnail", image);
              setTouched((current) => ({ ...current, thumbnail: true }));
            }}
            onBusyChange={setUploading}
            describedBy={errors.thumbnail ? "thumbnail-error" : undefined}
            invalid={Boolean(errors.thumbnail)}
          />
          {errors.thumbnail && (
            <p id="thumbnail-error" className="text-small font-medium text-danger">
              {errors.thumbnail}
            </p>
          )}
        </div>

        {values.thumbnail && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Field
              field="thumbnail_alt_en"
              errors={errors}
              help={t.help.thumbnail_alt_en}
              counter={<Counter value={values.thumbnail_alt_en} max={ALT_MAX} />}
            >
              <input
                {...text("thumbnail_alt_en")}
                aria-describedby={describedBy("thumbnail_alt_en", errors, true)}
              />
            </Field>
            <Field
              field="thumbnail_alt_id"
              errors={errors}
              counter={<Counter value={values.thumbnail_alt_id} max={ALT_MAX} />}
            >
              <input
                {...text("thumbnail_alt_id")}
                aria-describedby={describedBy("thumbnail_alt_id", errors, false)}
              />
            </Field>
          </div>
        )}

        <div className="max-w-48">
          <Field field="sort_order" errors={errors} help={t.help.sort_order}>
            <input
              id="sort_order"
              name="sort_order"
              type="text"
              inputMode="numeric"
              value={values.sort_order}
              onChange={(event) => set("sort_order", event.target.value)}
              onBlur={blur("sort_order")}
              aria-invalid={errors.sort_order ? true : undefined}
              aria-describedby={describedBy("sort_order", errors, true)}
              className={cn(inputClass, errors.sort_order ? "border-danger" : "border-border")}
            />
          </Field>
        </div>

        <div className="grid gap-5">
          <Toggle
            id="featured"
            label={fieldLabels.featured}
            description={t.help.featured}
            checked={values.featured}
            onChange={(checked) => set("featured", checked)}
          />
          <Toggle
            id="published"
            label={fieldLabels.published}
            description={t.help.published}
            checked={values.published}
            onChange={(checked) => {
              set("published", checked);
              setTouched((current) => ({ ...current, thumbnail: true }));
            }}
          />
        </div>

        {/* Sticky on phones so Save is always reachable (App Flow S-12). */}
        <div className="sticky bottom-0 -mx-4 flex flex-wrap gap-3 border-t border-border bg-bg px-4 py-3 md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
          <Button type="submit" loading={saving} disabled={uploading}>
            {saving ? t.saving : t.save}
          </Button>
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            {t.cancel}
          </Button>
        </div>
      </form>

      {props.mode === "edit" && (
        <section aria-labelledby="danger-heading" className="mt-12 border-t border-border pt-8">
          <h2 id="danger-heading" className="sr-only">
            {t.danger.heading}
          </h2>
          <Button variant="danger" onClick={() => setDialog("delete")} disabled={saving}>
            {t.danger.button}
          </Button>
        </section>
      )}

      <ConfirmDialog
        open={dialog === "discard"}
        title={t.discard.title}
        confirmLabel={t.discard.confirm}
        cancelLabel={t.discard.cancel}
        onConfirm={discardChanges}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        tone="danger"
        title={t.danger.title(initial.title_en)}
        body={t.danger.body}
        confirmLabel={t.danger.confirm}
        cancelLabel={t.danger.cancel}
        busy={deleting}
        onConfirm={deleteProject}
        onCancel={() => setDialog(null)}
      />

      {toast && <Toast key={toast.id} tone="error" message={toast.message} />}
    </>
  );
}
