"use client";

import {
  Counter,
  describedBy,
  Field,
  inputBorder,
  inputClass,
  Pair,
} from "@/components/admin/FormField";
import { ImageUploader, type UploadedImage } from "@/components/admin/ImageUploader";
import {
  visualFields,
  type FieldErrors,
  type FormValues,
} from "@/components/admin/project-form-model";
import { SegmentedControl } from "@/components/admin/SegmentedControl";
import { adminStrings } from "@/components/admin/strings";
import { cn } from "@/lib/cn";
import {
  ALT_MAX,
  CARD_CAPTION_MAX,
  CARD_NUMBER_MAX,
  fieldLabels,
  VISUAL_TYPES,
  type VisualType,
} from "@/lib/projects/validation";

const t = adminStrings.form;

type TextField =
  "thumbnail_alt_en" | "thumbnail_alt_id" | "card_number" | "card_caption_en" | "card_caption_id";

type VisualFieldProps = {
  values: Pick<FormValues, "visual_type" | "thumbnail" | TextField>;
  errors: FieldErrors;
  savedPublicId: string | null;
  onVisualType: (value: VisualType) => void;
  onThumbnail: (value: UploadedImage | null) => void;
  onText: (field: TextField, value: string) => void;
  onBlur: (field: TextField) => void;
  onBusyChange: (busy: boolean) => void;
};

/**
 * S-12 fields 13–15: Screenshot (ImageUploader v1 + alt text) or Number card (number + caption).
 * Both may stay stored; `visual_type` decides which one the site uses. The other pane is hidden,
 * unless it holds an error, so a problem is never out of reach.
 */
export function VisualField({
  values,
  errors,
  savedPublicId,
  onVisualType,
  onThumbnail,
  onText,
  onBlur,
  onBusyChange,
}: VisualFieldProps) {
  const shown = (type: VisualType) =>
    values.visual_type === type || visualFields[type].some((field) => errors[field]);

  const text = (field: TextField, hasHelp = false) => ({
    id: field,
    name: field,
    value: values[field],
    onChange: (event: { target: { value: string } }) => onText(field, event.target.value),
    onBlur: () => onBlur(field),
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": describedBy(field, errors, hasHelp),
    className: cn(inputClass, inputBorder(Boolean(errors[field]))),
  });

  return (
    <>
      <div className="grid gap-1.5">
        <span id="visual_type-label" className="text-small font-medium">
          {fieldLabels.visual_type}
        </span>
        <SegmentedControl
          id="visual_type"
          labelledBy="visual_type-label"
          options={VISUAL_TYPES.map((value) => ({ value, label: t.visualTypes[value] }))}
          value={values.visual_type}
          onChange={onVisualType}
        />
      </div>

      {shown("screenshot") && (
        <div className="grid gap-5">
          {/* A group label, not <label htmlFor>: that would rename the "Replace" button. */}
          <Field field="thumbnail" label={fieldLabels.thumbnail} errors={errors} as="group">
            <div className="max-w-[420px]">
              <ImageUploader
                id="thumbnail"
                value={values.thumbnail}
                savedPublicId={savedPublicId}
                onChange={onThumbnail}
                onBusyChange={onBusyChange}
                describedBy={errors.thumbnail ? "thumbnail-error" : undefined}
                invalid={Boolean(errors.thumbnail)}
              />
            </div>
          </Field>
          {values.thumbnail && (
            <Pair>
              <Field
                field="thumbnail_alt_en"
                label={fieldLabels.thumbnail_alt_en}
                errors={errors}
                help={t.help.thumbnail_alt_en}
                aside={<Counter value={values.thumbnail_alt_en} max={ALT_MAX} />}
              >
                <input {...text("thumbnail_alt_en", true)} />
              </Field>
              <Field
                field="thumbnail_alt_id"
                label={fieldLabels.thumbnail_alt_id}
                errors={errors}
                aside={<Counter value={values.thumbnail_alt_id} max={ALT_MAX} />}
              >
                <input {...text("thumbnail_alt_id")} />
              </Field>
            </Pair>
          )}
        </div>
      )}

      {shown("number") && (
        <div className="grid gap-5">
          <div className="md:max-w-[calc(50%-0.5rem)]">
            <Field
              field="card_number"
              label={fieldLabels.card_number}
              errors={errors}
              help={t.help.card_number}
              aside={<Counter value={values.card_number} max={CARD_NUMBER_MAX} />}
            >
              <input {...text("card_number", true)} />
            </Field>
          </div>
          <Pair>
            <Field
              field="card_caption_en"
              label={fieldLabels.card_caption_en}
              errors={errors}
              aside={<Counter value={values.card_caption_en} max={CARD_CAPTION_MAX} />}
            >
              <input {...text("card_caption_en")} />
            </Field>
            <Field
              field="card_caption_id"
              label={fieldLabels.card_caption_id}
              errors={errors}
              aside={<Counter value={values.card_caption_id} max={CARD_CAPTION_MAX} />}
            >
              <input {...text("card_caption_id")} />
            </Field>
          </Pair>
        </div>
      )}
    </>
  );
}
