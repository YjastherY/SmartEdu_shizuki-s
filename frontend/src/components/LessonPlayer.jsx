import { useEffect, useRef, useState } from "react";
import { assetUrl } from "../services/api.js";

export default function LessonPlayer({ lesson }) {
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);
  const videoUrl = assetUrl(lesson.videoUrl);
  const timerRef = useRef(null);

  useEffect(() => {
    setFailed(false);
    setReady(false);
    setSlow(false);
    if (!videoUrl) return undefined;
    timerRef.current = window.setTimeout(() => setSlow(true), 6000);
    return () => window.clearTimeout(timerRef.current);
  }, [videoUrl]);

  function markReady() {
    window.clearTimeout(timerRef.current);
    setReady(true);
  }

  if (videoUrl && !failed) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-950">
        {!ready && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900 px-6 text-center text-sm text-slate-300">
            <span>{slow ? "Видео грузится дольше обычного..." : "Загружаем видео..."}</span>
            {slow && (
              <a className="font-semibold text-brand-300" href={videoUrl} target="_blank" rel="noreferrer">
                Открыть файл отдельно
              </a>
            )}
          </div>
        )}
        <video
          className="h-full w-full bg-black"
          controls
          preload="metadata"
          src={videoUrl}
          onCanPlay={markReady}
          onLoadedMetadata={markReady}
          onError={() => setFailed(true)}
        >
          Ваш браузер не поддерживает видео.
        </video>
      </div>
    );
  }

  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center rounded-lg bg-slate-100 px-6 text-center text-slate-500 dark:bg-slate-800 dark:text-slate-300">
      <p>{failed ? "Видео не удалось загрузить. Проверьте файл или загрузите видео заново." : "Для этого урока видео пока не добавлено"}</p>
      {failed && videoUrl && (
        <a className="mt-2 text-sm font-semibold text-brand-600" href={videoUrl} target="_blank" rel="noreferrer">
          Открыть видео в новой вкладке
        </a>
      )}
    </div>
  );
}
