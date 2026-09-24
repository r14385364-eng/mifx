export const SAVED_CREDENTIALS_KEY = "gotrade_saved_credentials";

export interface SavedCredentials {
  email: string;
  password: string;
}

function getStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== "undefined") {
      return localStorage;
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
  return null;
}

export function saveLoginCredentials(email: string, password?: string): void {
  try {
    const storage = getStorage();
    if (storage) {
      storage.setItem(
        SAVED_CREDENTIALS_KEY,
        JSON.stringify({ email: email.trim(), password: password || "" }),
      );
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

export function getSavedLoginCredentials(): SavedCredentials {
  try {
    const storage = getStorage();
    if (storage) {
      const raw = storage.getItem(SAVED_CREDENTIALS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          email: typeof parsed?.email === "string" ? parsed.email : "",
          password: typeof parsed?.password === "string" ? parsed.password : "",
        };
      }
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
  return { email: "", password: "" };
}
