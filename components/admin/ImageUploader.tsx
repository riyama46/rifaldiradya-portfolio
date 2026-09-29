"use client";

import Image from "next/image";
import { useRef, useState, type DragEvent } from "react";
import { adminStrings } from "@/components/admin/strings";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { compressImage, isSourceProblem, type SourceProblem } from "@/lib/images/compress";
import { ACCEPTED_TYPES, extensionFor } from "@/lib/images/rules";

export type UploadedImage = { public_id: string; url: string; width: number; height: number };

type Status =
  | { kind: "idle" }
  | { kind: "preparing" }
  | { kind: "uploading"; percent: number }
  | { kind: "error"; message: string };

type ImageUploaderProps = {
  /** Put on the main button so the form's <label htmlFor> focuses it. */
  id: string;
  value: UploadedImage | null;
  /** The image saved on the project (S-13). It is never deleted from here, only via API-04/05. */
  savedPublicId?: string | null;
  onChange: (value: UploadedImage | null) => void;
  /** Save stays disabled while an upload runs (App Flow S-12). */
  onBusyChange?: (busy: boolean) => void;
  describedBy?: string;
  invalid?: boolean;
};

const strings = adminStrings.uploader;

function problemMessage(problem: SourceProblem): string {
  switch (problem.kind) {
    case "type":
      return strings.errors.type;
    case "size":
      return strings.errors.size(problem.megabytes);
    case "width":
      return strings.errors.width(problem.width);
    case "short":
      return strings.errors.short(problem.height);
    case "tooLarge":
      return strings.errors.tooLarge;
    default:
      return strings.errors.unreadable;
  }
}

type UploadResult = { status: number; body: unknown };

/** XMLHttpRequest instead of fetch: fetch has no upload progress events. */
function send(form: FormData, onProgress: (percent: number) => void): Promise<UploadResult> {
  return new Promise((resolve) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/admin/uploads");
    request.responseType = "json";
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => resolve({ status: request.status, body: request.response });
    request.onerror = () => resolve({ status: 0, body: null });
    request.send(form);
  });
}

/** API-07 for an upload that was never saved on the project; failures only leave an orphan. */
function discard(publicId: string) {
  void fetch(`/api/admin/uploads/${encodeURIComponent(publicId)}`, { method: "DELETE" }).catch(
    () => undefined,
  );
}

const isUploadedImage = (body: unknown): body is UploadedImage =>
  typeof body === "object" && body !== null && "public_id" in body && "url" in body;

const serverMessage = (body: unknown) =>
  (body as { error?: { message?: string } } | null)?.error?.message;

export function ImageUploader({
  id,
  value,
  savedPublicId = null,
  onChange,
  onBusyChange,
  describedBy,
  invalid = false,
}: ImageUploaderProps) {
  const input = useRef<HTMLInputElement>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);
  const busy = status.kind === "preparing" || status.kind === "uploading";

  function update(next: Status) {
    setStatus(next);
    onBusyChange?.(next.kind === "preparing" || next.kind === "uploading");
  }

  function replaceValue(next: UploadedImage | null) {
    if (value && value.public_id !== savedPublicId && value.public_id !== next?.public_id) {
      discard(value.public_id);
    }
    onChange(next);
  }

  async function handleFile(file: File) {
    setLastFile(file);
    update({ kind: "preparing" });

    const compressed = await compressImage(file);
    if (isSourceProblem(compressed)) {
      update({ kind: "error", message: problemMessage(compressed) });
      return;
    }

    const form = new FormData();
    for (const variant of compressed.variants) {
      form.append("variant", variant.blob, `${variant.width}.${extensionFor(compressed.format)}`);
    }

    update({ kind: "uploading", percent: 0 });
    const result = await send(form, (percent) => setStatus({ kind: "uploading", percent }));

    if (result.status === 201 && isUploadedImage(result.body)) {
      replaceValue(result.body);
      setLastFile(null);
      update({ kind: "idle" });
    } else if (result.status === 401) {
      update({ kind: "error", message: strings.errors.session });
    } else {
      update({
        kind: "error",
        message:
          result.status >= 400 && result.status < 500
            ? (serverMessage(result.body) ?? strings.errors.failed)
            : strings.errors.failed,
      });
    }
  }

  function onPick(files: FileList | null) {
    const file = files?.[0];
    if (input.current) input.current.value = ""; // picking the same file again still fires change
    if (file) void handleFile(file);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (!busy) onPick(event.dataTransfer.files);
  }

  const openPicker = () => input.current?.click();

  return (
    <div className="grid gap-3">
      <input
        ref={input}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        hidden
        onChange={(event) => onPick(event.target.files)}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "relative grid aspect-[16/10] w-full max-w-[480px] place-items-center overflow-hidden rounded-card border bg-surface",
          value ? "border-border" : "border-dashed",
          dragging ? "border-accent bg-accent-soft" : invalid ? "border-danger" : "border-border",
        )}
      >
        {value ? (
          <Image
            src={value.url}
            width={value.width}
            height={value.height}
            sizes="(min-width: 1024px) 480px, 100vw"
            alt={strings.previewAlt}
            className="size-full object-cover"
          />
        ) : (
          <div className="grid justify-items-center gap-2 p-6 text-center text-small text-text-muted">
            <p>
              {strings.drop}{" "}
              <button
                id={id}
                type="button"
                onClick={openPicker}
                disabled={busy}
                aria-describedby={describedBy}
                className="cursor-pointer font-medium text-text underline decoration-accent decoration-2 underline-offset-4 disabled:cursor-not-allowed"
              >
                {strings.choose}
              </button>
            </p>
            <p>{strings.hint}</p>
          </div>
        )}

        {busy && (
          <div className="absolute inset-x-0 bottom-0 grid gap-2 bg-surface-raised/95 p-3 text-small">
            <p>
              {status.kind === "uploading" ? strings.uploading(status.percent) : strings.preparing}
            </p>
            <div
              role="progressbar"
              aria-label={strings.preparing}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={status.kind === "uploading" ? status.percent : undefined}
              className="h-1.5 overflow-hidden rounded-full bg-border"
            >
              <div
                className="h-full origin-left bg-accent"
                style={{
                  transform: `scaleX(${status.kind === "uploading" ? status.percent / 100 : 0})`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {value && (
        <div className="flex flex-wrap gap-2">
          <Button
            id={id}
            variant="secondary"
            size="sm"
            onClick={openPicker}
            disabled={busy}
            aria-describedby={describedBy}
          >
            {strings.replace}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => replaceValue(null)} disabled={busy}>
            {strings.remove}
          </Button>
        </div>
      )}

      <p className="text-small text-text-muted">{strings.cropNote}</p>

      <div aria-live="polite">
        {status.kind === "error" && (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-small font-medium text-danger">{status.message}</p>
            {lastFile && (
              <Button variant="secondary" size="sm" onClick={() => void handleFile(lastFile)}>
                {strings.retry}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
