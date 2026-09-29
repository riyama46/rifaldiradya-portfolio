// Admin UI is English only (App Flow G3), so its copy lives here instead of the public dictionaries.
export const adminStrings = {
  appName: "Portfolio Admin",
  viewSite: "View site",
  logout: "Log out",
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
  projects: {
    title: "Projects",
    empty: "No projects yet. Add your first one to show it on the site.",
  },
} as const;
