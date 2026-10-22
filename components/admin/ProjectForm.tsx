"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CaseActionField } from "@/components/admin/CaseActionField";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  Counter,
  describedBy,
  Field,
  FormSection,
  inputBorder,
  inputClass,
  Pair,
} from "@/components/admin/FormField";
import { LinesInput } from "@/components/admin/LinesInput";
import { ProjectPreview } from "@/components/admin/ProjectPreview";
import {
  fieldOrder,
  filledLines,
  firstErrorField,
  isDirty,
  toPayload,
  validate,
  type FieldErrors,
  type FormValues,
} from "@/components/admin/project-form-model";
import { SegmentedControl } from "@/components/admin/SegmentedControl";
import { StackInput } from "@/components/admin/StackInput";
import { adminStrings, type NoticeKey } from "@/components/admin/strings";
import { VisualField } from "@/components/admin/VisualField";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { Toggle } from "@/components/ui/Toggle";
import { cn } from "@/lib/cn";
import {
  CASE_DID_LINES_MAX,
  CASE_IS_MAX,
  fieldLabels,
  messages,
  META_MAX,
  PROJECT_GROUPS,
  SIDE_MAX,
  STATUS_MAX,
  SUMMARY_MAX,
  TAGS_MAX,
  TITLE_MAX,
  type ProjectField,
} from "@/lib/projects/validation";

const t = adminStrings.form;

type ProjectFormProps = {
  initial: FormValues;
  /** E-26: five other projects already have "Show in Selected work" on. */
  selectedWorkFull: boolean;
} & ({ mode: "create" } | { mode: "edit"; projectId: string; savedPublicId: string | null });

type ApiErrorBody = { error?: { code?: string; fields?: FieldErrors } };

type TextField = {
  [K in keyof FormValues]: FormValues[K] extends string ? K : never;
}[keyof FormValues] &
  ProjectField;

/**
 * S-12 / S-13 (CHANGE v2.0.0 Delta APP_FLOW section 6, UF-07…UF-10), in the sections of
 * admin.html, with the live preview beside the form at 1024 px and up (v2.1.0). The shared Zod schema validates on blur and
 * before submit; the server validates again (and checks E-26) and its field errors show the same way.
 */
export function ProjectForm(props: ProjectFormProps) {
  const router = useRouter();
  const { initial, selectedWorkFull } = props;
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
  const [tagError, setTagError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"discard" | "delete" | null>(null);
  const [deleting, setDeleting] = useState(false);
  const leaving = useRef(false);
  const showToast = (message: string) =>
    setToast((previous) => ({ id: (previous?.id ?? 0) + 1, message }));
  const focusAfterRender = useRef<ProjectField | null>(null);

  const dirty = isDirty(initial, values);
  const clientErrors = validate(values);
  // Client errors show once a field was left (blur) or after the first submit; server errors
  // show until that field changes.
  const errors: FieldErrors = { ...serverErrors };
  for (const [field, message] of Object.entries(clientErrors) as [ProjectField, string][]) {
    if (submitted || touched[field]) errors[field] ??= message;
  }
  if (tagError) errors.tags = tagError;

  // The switch can always be turned off; it can only be turned on while there is room (E-26).
  const showOnHomeLocked = selectedWorkFull && !values.show_on_home;

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

  // A field in the hidden Visual pane is rendered only once its error shows; focus it after that.
  useEffect(() => {
    const field = focusAfterRender.current;
    if (!field) return;
    focusAfterRender.current = null;
    document.getElementById(field)?.focus();
  });

  function set<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setServerErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field as ProjectField];
      return next;
    });
  }

  const touch = (field: ProjectField) => setTouched((current) => ({ ...current, [field]: true }));

  function leave(notice?: NoticeKey) {
    leaving.current = true;
    router.push(notice ? `/admin?notice=${notice}` : "/admin");
  }

  function focusField(field: ProjectField) {
    const element = document.getElementById(field);
    if (element) element.focus();
    else focusAfterRender.current = field;
  }

  function showErrors(next: FieldErrors) {
    setSummary(true);
    const first = firstErrorField(next);
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
        showToast(t.saveFailed); // E-13
      }
    } catch {
      showToast(t.saveFailed);
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
      else showToast(t.danger.failed);
    } catch {
      setDialog(null);
      showToast(t.danger.failed);
    }
    setDeleting(false);
  }

  const text = (field: TextField, hasHelp = false) => ({
    id: field,
    name: field,
    value: values[field],
    onChange: (event: { target: { value: string } }) => set(field, event.target.value),
    onBlur: () => touch(field),
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": describedBy(field, errors, hasHelp),
    className: cn(inputClass, inputBorder(Boolean(errors[field]))),
  });

  /** Text input or textarea with its label and n/max counter. */
  const textField = (
    field: TextField,
    max: number,
    options: { help?: string; multiline?: boolean } = {},
  ) => (
    <Field
      field={field}
      label={fieldLabels[field]}
      errors={errors}
      help={options.help}
      aside={<Counter value={values[field]} max={max} />}
    >
      {options.multiline ? (
        <textarea rows={3} {...text(field, Boolean(options.help))} />
      ) : (
        <input {...text(field, Boolean(options.help))} />
      )}
    </Field>
  );

  const errorList = (Object.entries(errors) as [ProjectField, string][]).sort(
    ([a], [b]) => fieldOrder.indexOf(a) - fieldOrder.indexOf(b),
  );

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
      <form onSubmit={onSubmit} noValidate className="max-w-[860px]">
        {sessionExpired && (
          <p role="alert" className="mb-6 rounded-button bg-accent/12 px-4 py-3">
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
          <div role="alert" className="mb-8 rounded-card bg-danger/10 p-4">
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

        <FormSection id="basics" title={t.sections.basics.title}>
          <Pair>
            {textField("title_en", TITLE_MAX)}
            {textField("title_id", TITLE_MAX)}
          </Pair>
          <div className="grid gap-1.5">
            <span id="group-label" className="text-small font-medium">
              {fieldLabels.group}
            </span>
            <SegmentedControl
              id="group"
              labelledBy="group-label"
              describedBy="group-help"
              options={PROJECT_GROUPS.map((value) => ({ value, label: t.groups[value] }))}
              value={values.group}
              onChange={(value) => set("group", value)}
            />
            <p id="group-help" className="text-small text-text-muted">
              {t.help.group}
            </p>
          </div>
          <Pair>
            {textField("meta_en", META_MAX, { help: t.help.meta_en })}
            {textField("meta_id", META_MAX)}
          </Pair>
          <Pair>
            {textField("side_en", SIDE_MAX, { help: t.help.side_en })}
            {textField("side_id", SIDE_MAX)}
          </Pair>
        </FormSection>

        <FormSection
          id="homepage"
          title={t.sections.homepage.title}
          help={t.sections.homepage.help}
        >
          <Pair>
            {textField("summary_en", SUMMARY_MAX, { help: t.help.summary_en, multiline: true })}
            {textField("summary_id", SUMMARY_MAX, { multiline: true })}
          </Pair>
          <div className="grid gap-1.5">
            <Toggle
              id="show_on_home"
              label={fieldLabels.show_on_home}
              description={showOnHomeLocked ? messages.showOnHomeFull : t.help.show_on_home}
              checked={values.show_on_home}
              disabled={showOnHomeLocked}
              onChange={(checked) => set("show_on_home", checked)}
            />
            {errors.show_on_home && (
              <p id="show_on_home-error" className="text-small font-medium text-danger">
                {errors.show_on_home}
              </p>
            )}
          </div>
        </FormSection>

        <FormSection id="case" title={t.sections.case.title} help={t.sections.case.help}>
          <Pair>
            {textField("case_is_en", CASE_IS_MAX, { multiline: true })}
            {textField("case_is_id", CASE_IS_MAX, { multiline: true })}
          </Pair>
          <Pair>
            {(["case_did_en", "case_did_id"] as const).map((field) => (
              <Field
                key={field}
                field={field}
                label={fieldLabels[field]}
                errors={errors}
                as="group"
                aside={t.lines(filledLines(values[field]), CASE_DID_LINES_MAX)}
              >
                <LinesInput
                  id={field}
                  language={field.endsWith("_en") ? "EN" : "ID"}
                  lines={values[field]}
                  onChange={(next) => set(field, next)}
                  onBlur={() => touch(field)}
                  invalid={Boolean(errors[field])}
                  describedBy={errors[field] ? `${field}-error` : undefined}
                />
              </Field>
            ))}
          </Pair>
          <Field
            field="tags"
            label={fieldLabels.tags}
            errors={errors}
            help={t.help.tags}
            aside={t.tagsCount(values.tags.length, TAGS_MAX)}
          >
            <StackInput
              id="tags"
              tags={values.tags}
              onChange={(next) => set("tags", next)}
              onBlur={() => touch("tags")}
              onError={setTagError}
              invalid={Boolean(errors.tags)}
              describedBy={describedBy("tags", errors, true)}
            />
          </Field>
          <Pair>
            {textField("status_en", STATUS_MAX, { help: t.help.status_en })}
            {textField("status_id", STATUS_MAX)}
          </Pair>
        </FormSection>

        <FormSection id="button" title={t.sections.button.title} help={t.sections.button.help}>
          <CaseActionField
            id="case_action"
            legend={fieldLabels.case_action}
            value={values.case_action}
            onChange={(value) => {
              set("case_action", value);
              // The live URL error depends on this choice; drop a stale server one.
              setServerErrors((current) => {
                if (!current.live_url) return current;
                const next = { ...current };
                delete next.live_url;
                return next;
              });
            }}
          />
          <Field
            field="live_url"
            label={fieldLabels.live_url}
            errors={errors}
            help={t.help.live_url}
            aside={values.case_action === "site" ? undefined : t.optional}
          >
            <input
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="https://"
              {...text("live_url", true)}
            />
          </Field>
        </FormSection>

        <FormSection id="visual" title={t.sections.visual.title} help={t.sections.visual.help}>
          <VisualField
            values={values}
            errors={errors}
            savedPublicId={savedPublicId}
            onVisualType={(value) => set("visual_type", value)}
            onThumbnail={(image) => {
              set("thumbnail", image);
              touch("thumbnail");
            }}
            onText={(field, value) => set(field, value)}
            onBlur={touch}
            onBusyChange={setUploading}
          />
        </FormSection>

        <FormSection id="publishing" title={t.sections.publishing.title}>
          <Toggle
            id="published"
            label={fieldLabels.published}
            description={t.help.published}
            checked={values.published}
            onChange={(checked) => {
              set("published", checked);
              touch("thumbnail");
            }}
          />
          {props.mode === "edit" && (
            <div className="mt-2 flex flex-col items-stretch justify-between gap-4 border-t border-border pt-6 md:flex-row md:items-center">
              <div>
                <p id="danger-heading" className="font-medium">
                  {t.danger.heading}
                </p>
                <p className="text-small text-text-muted">{t.danger.help}</p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDialog("delete")}
                disabled={saving}
              >
                {t.danger.button}
              </Button>
            </div>
          )}
        </FormSection>

        {/* Sticky so Save is always reachable (App Flow S-12, admin.html .savebar). */}
        <div className="sticky bottom-0 z-10 -mx-4 mt-2 flex items-center justify-end gap-2.5 border-t border-border bg-bg px-4 py-3.5 md:mx-0 md:px-0">
          <p className="mr-auto hidden text-small text-text-muted md:block">{t.saveNote}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 md:flex-none"
          >
            {t.cancel}
          </Button>
          <Button
            type="submit"
            size="sm"
            loading={saving}
            disabled={uploading}
            className="flex-1 md:flex-none"
          >
            {saving ? t.saving : t.save}
          </Button>
        </div>
      </form>

      <ProjectPreview values={values} />

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
    </div>
  );
}
