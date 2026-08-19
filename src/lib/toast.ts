export type ToastPayload = {
  id: string;
  message: string;
};

const TOAST_EVENT = "app:toast";

export function showToast(message: string) {
  const payload: ToastPayload = {
    id: crypto.randomUUID(),
    message,
  };
  window.dispatchEvent(
    new CustomEvent<ToastPayload>(TOAST_EVENT, { detail: payload }),
  );
}

export function subscribeToast(callback: (payload: ToastPayload) => void) {
  function handler(e: Event) {
    callback((e as CustomEvent<ToastPayload>).detail);
  }
  window.addEventListener(TOAST_EVENT, handler);
  return () => window.removeEventListener(TOAST_EVENT, handler);
}
