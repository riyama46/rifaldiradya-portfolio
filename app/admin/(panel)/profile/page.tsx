import type { Metadata } from "next";
import { ProfileForm } from "@/components/admin/ProfileForm";
import { adminStrings } from "@/components/admin/strings";
import { requireAdmin } from "@/lib/auth/guard";
import { mediaUrl } from "@/lib/images/rules";
import { getProfilePhoto } from "@/lib/images/store";

export const metadata: Metadata = { title: adminStrings.profile.title };

// S-14 Profile (DECISIONS T-18b): the hero byline photo.
export default async function ProfilePage() {
  await requireAdmin("/admin/profile");
  const photo = await getProfilePhoto();

  return (
    <>
      <h1 className="mb-8 text-heading">{adminStrings.profile.title}</h1>
      <ProfileForm
        initial={
          photo
            ? {
                public_id: photo.id,
                url: mediaUrl(photo.id, photo.format),
                width: photo.width,
                height: photo.height,
              }
            : null
        }
      />
    </>
  );
}
