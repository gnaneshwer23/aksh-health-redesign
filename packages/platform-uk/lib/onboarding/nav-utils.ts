export function saveForLater() {
  if (typeof window === "undefined") return;
  localStorage.setItem("aksh_onboarding_saved", new Date().toISOString());
}
