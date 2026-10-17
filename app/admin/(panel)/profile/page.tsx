import type { Metadata } from "next";
import { ProfileForm } from "@/components/admin/ProfileForm";
import { adminStrings } from "@/components/admin/strings";
import { requireAdmin } from "@/lib/auth/guard";
import { mediaUrl } from "@/lib/images/rules";
import { getAvailability, getProfilePhoto } from "@/lib/images/store";

export const metadata: Metadata = { title: adminStrings.profile.title };

// S-14 Profile (CHANGE v2.0.0 Delta APP_FLOW section 6): hero photo and the availability switch.
export default async function ProfilePage() {
  await requireAdmin("/admin/profile");
  const [photo, availabilityOn] = await Promise.all([getProfilePhoto(), getAvailability()]);

  return (
    <>
      <h1 className="text-heading">{adminStrings.profile.title}</h1>
      <p className="mt-1.5 mb-10 text-text-muted">{adminStrings.profile.intro}</p>
      <ProfileForm
        availabilityOn={availabilityOn}
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
