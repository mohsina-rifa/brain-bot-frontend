import { onScopeDispose } from "vue";

export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delay = 300,
) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  function cancel() {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  function invoke(...args: A) {
    cancel();
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delay);
  }

  function flush(...args: A) {
    cancel();
    fn(...args);
  }

  onScopeDispose(cancel);

  return { invoke, flush, cancel };
}
