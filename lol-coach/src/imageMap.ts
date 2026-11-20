import { useEffect, useState } from 'react';

/** 取り込んだ教科書図版の「章ID → 画像パス」。デスクトップ版以外では常に null */
export function useImageMap(): Record<string, string[]> | null {
  const [map, setMap] = useState<Record<string, string[]> | null>(null);
  useEffect(() => {
    const bridge = window.lolApp;
    if (!bridge) return;
    const load = () => void bridge.imageMap().then(setMap);
    load();
    return bridge.onImagesChanged(load);
  }, []);
  return map;
}

export const imageUrl = (zipPath: string) => `lolimg://img/${encodeURIComponent(zipPath.split('/').pop() ?? '')}`;
