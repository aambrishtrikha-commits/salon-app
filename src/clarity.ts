declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

/** Safe no-ops until the Clarity snippet loads. */
function call(...args: unknown[]) {
  try {
    window.clarity?.(...args);
  } catch {
    /* ignore */
  }
}

export function tag(key: string, value: string) {
  call("set", key, value);
}

export function track(name: string) {
  call("event", name);
}

export function identify(id: string, friendly?: string) {
  call("identify", id, undefined, undefined, friendly);
}
