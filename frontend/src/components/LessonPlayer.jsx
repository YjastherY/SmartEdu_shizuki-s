export default function LessonPlayer({ lesson }) {
  if (lesson.videoUrl) {
    return (
      <video className="aspect-video w-full rounded-lg bg-black" controls src={lesson.videoUrl}>
        Ваш браузер не поддерживает видео.
      </video>
    );
  }

  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
      Для этого урока видео пока не добавлено
    </div>
  );
}
