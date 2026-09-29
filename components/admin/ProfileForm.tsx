"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImageUploader, type UploadedImage } from "@/components/admin/ImageUploader";
import { adminStrings } from "@/components/admin/strings";
import { Button } from "@/components/ui/Button";
import { Toast, type ToastTone } from "@/components/ui/Toast";

const t = adminStrings.profile;

type ApiError = { error?: { fields?: { photo?: string } } };

/** S-14: upload, replace, or remove the hero photo, then Save (API-09). */
export function ProfileForm({ initial }: { initial: UploadedImage | null }) {
  const router = useRouter();
  const [photo, setPhoto] = useState<UploadedImage | null>(initial);
  const [saved, setSaved] = useState<string | null>(initial?.public_id ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: number; tone: ToastTone; message: string } | null>(null);

  const dirty = (photo?.public_id ?? null) !== saved;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_public_id: photo?.public_id ?? null }),
      });
      if (response.ok) {
        const body = (await response.json()) as { revalidated?: boolean };
        setSaved(photo?.public_id ?? null);
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
        setError(body.error?.fields?.photo ?? t.failed);
      }
    } catch {
      setError(t.failed);
    }
    setSaving(false);
  }

  return (
    <div className="grid max-w-xl gap-6">
      <div role="group" aria-labelledby="photo-label" className="grid gap-1.5">
        <p id="photo-label" className="text-small font-medium">
          {t.photo}
        </p>
        <p className="text-small text-text-muted">{t.intro}</p>
        <ImageUploader
          id="photo"
          imageKind="avatar"
          value={photo}
          savedPublicId={saved}
          onChange={(value) => {
            setPhoto(value);
            setError(null);
          }}
          onBusyChange={setUploading}
          describedBy={error ? "photo-error" : undefined}
          invalid={Boolean(error)}
        />
        {error && (
          <p id="photo-error" role="alert" className="text-small font-medium text-danger">
            {error}
          </p>
        )}
      </div>

      <div>
        <Button onClick={save} loading={saving} disabled={uploading || !dirty}>
          {saving ? t.saving : t.save}
        </Button>
      </div>

      {toast && <Toast key={toast.id} tone={toast.tone} message={toast.message} />}
    </div>
  );
}
