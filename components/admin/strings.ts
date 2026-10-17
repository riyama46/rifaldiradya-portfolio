// Admin UI is English only (App Flow G3), so its copy lives here instead of the public dictionaries.
export const adminStrings = {
  appName: "Portfolio Admin",
  viewSite: "View site",
  logout: "Log out",
  theme: { toDark: "Switch to dark mode", toLight: "Switch to light mode" },
  loadError: "Couldn't load this page. Check the database connection and try again.",
  retry: "Try again",
  signIn: {
    title: "Sign in",
    email: "Email",
    password: "Password",
    show: "Show",
    hide: "Hide",
    showPassword: "Show password",
    hidePassword: "Hide password",
    submit: "Sign in",
    submitting: "Signing in…",
    invalidCredentials: "Email or password is incorrect.",
    missingFields: "Enter your email and password.",
    rateLimited: (minutes: number) =>
      `Too many attempts. Try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`,
    notConfigured: "Admin login is not configured on the server yet.",
    network: "Couldn't reach the server. Check your connection and try again.",
    server: "Couldn't sign in right now. Try again.",
  },
  nav: {
    label: "Admin",
    projects: "Projects",
    profile: "Profile",
  },
  // S-14 Profile (DECISIONS T-18b): the photo in the homepage hero byline.
  profile: {
    title: "Profile",
    photo: "Photo",
    intro:
      "Shown as a small circle next to your name at the top of the homepage. Without a photo the site shows your initials.",
    save: "Save",
    saving: "Saving…",
    saved: "Profile saved",
    savedStale: "Saved, but the site may take a few minutes to update.",
    failed: "Couldn't save. Try again.",
  },
  // ImageUploader (App Flow S-12 field 7, section 11 messages, E-12).
  uploader: {
    drop: "Drag an image here, or",
    choose: "choose a file",
    hint: "JPG, PNG, or WebP · at least 1200 px wide · under 5 MB · recommended 1600 × 1000",
    cropNote: "Cropped to 16:10 from the top, like the site's cards.",
    hintAvatar: "JPG, PNG, or WebP · at least 320 × 320 px · under 5 MB",
    cropNoteAvatar: "Cropped to a centred square and shown as a circle.",
    preparing: "Preparing image…",
    uploading: (percent: number) => `Uploading… ${percent}%`,
    replace: "Replace",
    remove: "Remove",
    retry: "Retry",
    previewAlt: "Thumbnail preview",
    errors: {
      type: "Use a JPG, PNG, or WebP image.",
      size: (megabytes: number) => `This image is ${megabytes} MB. Upload one under 5 MB.`,
      width: (width: number, minimum: number) =>
        `This image is ${width} px wide. Use one at least ${minimum} px wide.`,
      short: (height: number) =>
        `This image is only ${height} px tall. Use one at least 750 px tall for a 16:10 thumbnail.`,
      unreadable: "This file couldn't be read as an image. Try another one.",
      tooLarge: "This image is too detailed to compress under 1 MB. Try another one.",
      failed: "Upload failed. Check your connection and try again.",
      session: "Your session expired. Sign in again in a new tab, then retry.",
    },
  },
  projects: {
    title: "Projects",
    count: (n: number) => `${n} ${n === 1 ? "project" : "projects"}`,
    newProject: "New project",
    empty: "No projects yet. Add your first one to show it on the site.",
    selectedWork: (n: number, limit: number) =>
      `Selected work on the homepage: ${n} of ${limit}. Turn one off before adding another.`,
    gridInfo: "Shown on homepage grid: first 6 published projects in this order.",
    orderHelp: "Use ↑ and ↓ to change the order. New projects are added at the top.",
    moveUp: (title: string) => `Move ${title} up`,
    moveDown: (title: string) => `Move ${title} down`,
    moved: (title: string, position: number) => `${title} moved to position ${position}.`,
    moveFailed: "Couldn't change the order. Try again.",
    published: "Published",
    draft: "Draft",
    onHome: "Homepage",
    edit: "Edit",
    editProject: (title: string) => `Edit ${title}`,
    columns: {
      thumbnail: "Thumbnail",
      title: "Title",
      status: "Status",
      order: "#",
      reorder: "Reorder",
      updated: "Updated",
      actions: "Actions",
    },
    order: (n: number) => `#${n}`,
    updated: (relative: string) => `Updated ${relative}`,
  },
  // S-12 / S-13 (App Flow section 6, E-11, E-13, E-16).
  form: {
    newTitle: "New project",
    editTitle: "Edit project",
    back: "Back to projects",
    english: "English",
    indonesian: "Indonesian",
    help: {
      summary_en: "Shown on the card",
      live_url: "Opens in a new tab on the site",
      tags: "Press Enter or comma to add. Up to 6, e.g. C#, ASP.NET",
      thumbnail_alt_en: "Describe what the image shows",
      show_on_home: "Up to 5 projects appear in Selected work on the homepage.",
      published: "Off = draft, not shown on the site",
    },
    counter: (current: number, max: number) => `${current}/${max}`,
    removeTag: (tag: string) => `Remove tag ${tag}`,
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    errorSummary: "Some fields need attention.",
    saveFailed: "Couldn't save. Your changes are still here — try again.",
    sessionExpired: "Your session expired. Sign in again in a new tab, then save.",
    signInLink: "Sign in (opens in a new tab)",
    discard: {
      title: "Discard changes?",
      confirm: "Discard",
      cancel: "Keep editing",
    },
    danger: {
      heading: "Delete project",
      button: "Delete project",
      title: (title: string) => `Delete ${title}?`,
      body: "This removes it from the site and deletes its image. This can't be undone.",
      confirm: "Delete",
      cancel: "Cancel",
      failed: "Couldn't delete. Try again.",
    },
  },
  // Toast after an action that lands on S-11 (App Flow S-11, E-14, E-19; set by T-17 via ?notice=).
  notices: {
    created: { tone: "success", message: "Project created" },
    saved: { tone: "success", message: "Changes saved" },
    deleted: { tone: "success", message: "Project deleted" },
    "saved-stale": {
      tone: "warning",
      message: "Saved, but the site may take a few minutes to update.",
    },
    "not-found": { tone: "warning", message: "Project not found" },
    gone: { tone: "warning", message: "This project no longer exists." },
  },
} as const;

export type NoticeKey = keyof typeof adminStrings.notices;

/** Whitelist lookup, so an arbitrary ?notice= value can never inject text into the page. */
export function parseNotice(value: string | string[] | undefined): NoticeKey | null {
  return typeof value === "string" && Object.hasOwn(adminStrings.notices, value)
    ? (value as NoticeKey)
    : null;
}
