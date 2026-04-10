import { useRef, useCallback } from "react";

export function useLongPress(onLongPress: () => void, delay = 500) {
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  const start = useCallback(() => {
    timer.current = setTimeout(onLongPress, delay);
  }, [onLongPress, delay]);

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { onTouchStart: start, onTouchEnd: cancel, onTouchMove: cancel };
}
