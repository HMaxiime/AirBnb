import { useState } from "react";

export function useLocalStorage<T>(key: string, initial: T): [T, (value: T) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initial;
    } catch {
      return initial;
    }
  });

  const setValue = (value: T): void => {
    try {
      setStored(value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage unavailable — state-only fallback
    }
  };

  return [stored, setValue];
}
