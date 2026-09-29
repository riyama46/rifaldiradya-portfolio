// Admin UI is English only (App Flow G3), so its copy lives here instead of the public dictionaries.
export const adminStrings = {
  appName: "Portfolio Admin",
  viewSite: "View site",
  logout: "Log out",
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
  // ImageUploader (App Flow S-12 field 7, section 11 messages, E-12).
  uploader: {
    drop: "Drag an image here, or",
    choose: "choose a file",
    hint: "JPG, PNG, or WebP · at least 1200 px wide · under 5 MB · recommended 1600 × 1000",
    cropNote: "Cropped to 16:10 from the top, like the site's cards.",
    preparing: "Preparing image…",
    uploading: (percent: number) => `Uploading… ${percent}%`,
    replace: "Replace",
    remove: "Remove",
    retry: "Retry",
    previewAlt: "Thumbnail preview",
    errors: {
      type: "Use a JPG, PNG, or WebP image.",
      size: (megabytes: number) => `This image is ${megabytes} MB. Upload one under 5 MB.`,
      width: (width: number) => `This image is ${width} px wide. Use one at least 1200 px wide.`,
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
    featuredInHero: (n: number, limit: number) => `Featured in homepage hero: ${n}/${limit}`,
    featuredOverLimit: "Only the first 3 featured projects appear in the homepage hero.",
    gridInfo: "Shown on homepage grid: first 6 published projects by sort order.",
    published: "Published",
    draft: "Draft",
    featured: "Featured",
    edit: "Edit",
    editProject: (title: string) => `Edit ${title}`,
    columns: {
      thumbnail: "Thumbnail",
      title: "Title",
      status: "Status",
      order: "Order",
      updated: "Updated",
      actions: "Actions",
    },
    order: (n: number) => `Order ${n}`,
    updated: (relative: string) => `Updated ${relative}`,
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
