"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormSection } from "@/components/admin/FormField";
import { ImageUploader, type UploadedImage } from "@/components/admin/ImageUploader";
import { adminStrings } from "@/components/admin/strings";
import { Button } from "@/components/ui/Button";
import { Toast, type ToastTone } from "@/components/ui/Toast";
import { Toggle } from "@/components/ui/Toggle";
import { AVATAR_WIDTHS } from "@/lib/images/rules";

const t = adminStrings.profile;
const SHARP_WIDTH = AVATAR_WIDTHS.at(-1)!;

type ApiError = { error?: { fields?: { photo?: string; availability_on?: string } } };
type Saved = { photo: string | null; availability: boolean };

/**
 * S-14 (CHANGE v2.0.0 Delta APP_FLOW section 6): the hero photo (at least 640 px) and the
 * "Show availability" switch, saved together with API-09. The availability text stays in the site
 * copy (D-16).
 */
export function ProfileForm({
  initial,
  availabilityOn,
}: {
  initial: UploadedImage | null;
  availabilityOn: boolean;
}) {
  const router = useRouter();
  const [photo, setPhoto] = useState<UploadedImage | null>(initial);
  const [availability, setAvailability] = useState(availabilityOn);
  const [saved, setSaved] = useState<Saved>({
    photo: initial?.public_id ?? null,
    availability: availabilityOn,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: number; tone: ToastTone; message: string } | null>(null);

  const photoId = photo?.public_id ?? null;
  const photoChanged = photoId !== saved.photo;
  const dirty = photoChanged || availability !== saved.availability;
  // E-32: a v1 photo (320 px) keeps showing; suggest a sharper one.
  const small = photo && photo.width < SHARP_WIDTH ? photo.width : null;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(photoChanged ? { photo_public_id: photoId } : {}),
          availability_on: availability,
        }),
      });
      if (response.ok) {
        const body = (await response.json()) as { revalidated?: boolean };
        setSaved({ photo: photoId, availability });
        setToast({
          id: Date.now(),
          tone: body.revalidated === false ? "warning" : "success",
          message: body.revalidated === false ? t.savedStale : t.saved,
        });
        router.refresh();
      } else if (response.status === 401) {
        setError(adminStrings.form.sessionExpired);
      } else {
        const body = (await response.json().catch(() => ({}))) as ApiError;
        setError(body.error?.fields?.photo ?? body.error?.fields?.availability_on ?? t.failed);
      }
    } catch {
      setError(t.failed);
    }
    setSaving(false);
  }

  return (
    <div className="max-w-[760px]">
      <FormSection id="photo" title={t.photo} help={t.photoHelp}>
        <div className="max-w-xs">
          <ImageUploader
            id="photo"
            imageKind="avatar"
            value={photo}
            savedPublicId={saved.photo}
            onChange={(value) => {
              setPhoto(value);
              setError(null);
            }}
            onBusyChange={setUploading}
            describedBy={
              [small && "photo-small", error && "profile-error"].filter(Boolean).join(" ") ||
              undefined
            }
            invalid={Boolean(error)}
          />
        </div>
        {small && (
          <p id="photo-small" className="text-small text-text-muted">
            {t.smallPhoto(small)}
          </p>
        )}
      </FormSection>

      <FormSection id="availability" title={t.availability} help={t.availabilityHelp}>
        <Toggle
          id="availability_on"
          label={t.availabilitySwitch}
          description={t.availabilitySwitchHelp}
          checked={availability}
          onChange={(checked) => {
            setAvailability(checked);
            setError(null);
          }}
        />
      </FormSection>

      {error && (
        <p id="profile-error" role="alert" className="mb-4 text-small font-medium text-danger">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 z-10 -mx-4 flex justify-end gap-2.5 border-t border-border bg-bg px-4 py-3.5 md:mx-0 md:px-0">
        <Button
          size="sm"
          onClick={save}
          loading={saving}
          disabled={uploading || !dirty}
          className="flex-1 md:flex-none"
        >
          {saving ? t.saving : t.save}
        </Button>
      </div>

      {toast && <Toast key={toast.id} tone={toast.tone} message={toast.message} />}
    </div>
  );
}
