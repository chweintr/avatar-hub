export const DEBUG_SIMLI =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("debug");
