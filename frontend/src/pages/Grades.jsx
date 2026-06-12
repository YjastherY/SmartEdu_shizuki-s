import { Award, BookOpen, CheckCircle2, Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";

export default function Grades() {
  const { user } = useAuth();
  if (user?.role === "TEACHER" || user?.role === "ADMIN") return <StaffGrades />;
  return <StudentGrades />;
}

function StudentGrades() {
  const [data, setData] = useState({ progress: [], attempts: [] });
  const [courseId, setCourseId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/progress/me")
      .then((result) => {
        setData(result);
        setCourseId(result.progress[0]?.courseId || result.attempts[0]?.test?.lesson?.module?.course?.id || "");
      })
      .finally(() => setLoading(false));
  }, []);

  const courses = useMemo(() => collectCourses(data), [data]);
  const selectedCourse = courses.find((course) => course.id === courseId) || courses[0];
  const rows = useMemo(() => buildRows(data.attempts, selectedCourse?.id), [data.attempts, selectedCourse?.id]);
  const finalGrade = rows.length ? Math.round(rows.reduce((sum, row) => sum + (row.countedScore ?? 0), 0) / rows.length) : 0;
  const pendingCount = rows.filter((row) => row.status === "PENDING_REVIEW").length;

  if (loading) return <div className="panel text-sm text-slate-500">Загружаем оценки...</div>;

  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Оценки</h1>
          <p className="text-sm text-slate-500">Выберите курс и смотрите, из чего складывается итог.</p>
        </div>
        <select className="input lg:w-80" value={selectedCourse?.id || ""} onChange={(event) => setCourseId(event.target.value)}>
          {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
        </select>
      </div>

      {!courses.length ? (
        <div className="panel text-sm text-slate-500">Оценки появятся после прохождения тестов.</div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <SummaryCard icon={Award} label="Итоговая" value={`${finalGrade}%`} tone="brand" />
            <SummaryCard icon={CheckCircle2} label="Засчитано работ" value={rows.filter((row) => row.status === "GRADED").length} tone="emerald" />
            <SummaryCard icon={Clock3} label="На проверке" value={pendingCount} tone="amber" />
          </section>

          <section className="panel overflow-hidden">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="text-brand-600" />
              <h2 className="text-lg font-bold">{selectedCourse?.title}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3">Работа</th>
                    <th className="px-4 py-3">Урок</th>
                    <th className="px-4 py-3">Лучшая оценка</th>
                    <th className="px-4 py-3">Баллы</th>
                    <th className="px-4 py-3">Попытки</th>
                    <th className="px-4 py-3">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {rows.map((row) => (
                    <tr key={row.testId} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/80">
                      <td className="px-4 py-4">
                        <p className="font-semibold">{row.title}</p>
                        <p className="text-xs text-slate-500">Засчитывается лучшая завершённая попытка.</p>
                      </td>
                      <td className="px-4 py-4 text-slate-500 dark:text-slate-300">{row.lessonTitle}</td>
                      <td className="px-4 py-4">
                        <span className="text-lg font-bold">{row.countedScore === null ? "—" : `${row.countedScore}%`}</span>
                      </td>
                      <td className="px-4 py-4 text-slate-500 dark:text-slate-300">{row.points}</td>
                      <td className="px-4 py-4">{row.attemptCount}</td>
                      <td className="px-4 py-4"><StatusBadge status={row.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">По этому курсу ещё нет оценок.</p>}
          </section>
        </>
      )}
    </div>
  );
}

function StaffGrades() {
  const [data, setData] = useState(null);
  const [groupId, setGroupId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    api("/teacher/overview").then((result) => {
      setData(result);
      const firstGroup = result.groups[0];
      setGroupId(firstGroup?.id || "");
      setStudentId(firstGroup?.students[0]?.id || "");
    });
  }, []);

  const groups = data?.groups || [];
  const selectedGroup = groups.find((group) => group.id === groupId) || groups[0];
  const selectedStudent = selectedGroup?.students.find((student) => student.id === studentId) || selectedGroup?.students[0];
  const studentWorks = useMemo(() => buildStudentWorks(data, selectedStudent), [data, selectedStudent]);
  const courses = Array.from(new Set(studentWorks.map((work) => work.course).filter(Boolean)));
  const filteredWorks = studentWorks.filter((work) => {
    const matchesCourse = courseFilter === "all" || work.course === courseFilter;
    const matchesStatus = statusFilter === "all" || work.status === statusFilter;
    return matchesCourse && matchesStatus;
  });
  const finalGrade = filteredWorks.length
    ? Math.round(filteredWorks.reduce((sum, work) => sum + (work.score || 0), 0) / filteredWorks.length)
    : 0;

  if (!data) return <div className="panel text-sm text-slate-500">Загружаем журнал оценок...</div>;

  return (
    <div className="page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Оценки</h1>
        <p className="text-sm text-slate-500">Журнал по группам, ученикам и работам.</p>
      </div>

      <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="panel space-y-5">
          <div>
            <h2 className="mb-3 font-bold">Группы</h2>
            <div className="space-y-2">
              {groups.map((group) => (
                <button
                  key={group.id}
                  className={`w-full rounded-lg border p-3 text-left transition ${selectedGroup?.id === group.id ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-100" : "border-slate-200 hover:border-brand-300 dark:border-slate-700"}`}
                  onClick={() => {
                    setGroupId(group.id);
                    setStudentId(group.students[0]?.id || "");
                  }}
                >
                  <span className="block font-semibold">{group.title}</span>
                  <span className="text-sm text-slate-500">{group.students.length} учеников</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-3 font-bold">Ученики</h2>
            <div className="space-y-2">
              {selectedGroup?.students.map((student) => (
                <button
                  key={student.id}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${selectedStudent?.id === student.id ? "bg-brand-600 text-white" : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"}`}
                  onClick={() => setStudentId(student.id)}
                >
                  {student.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="space-y-5">
          {selectedStudent ? (
            <>
              <div className="panel flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold">{selectedStudent.name}</h2>
                  <p className="text-sm text-slate-500">{selectedStudent.email} • {selectedStudent.group}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <SummaryCard icon={Award} label="Итоговая" value={`${finalGrade}%`} tone="brand" />
                  <SummaryCard icon={CheckCircle2} label="Работ" value={filteredWorks.length} tone="emerald" />
                  <SummaryCard icon={Clock3} label="На проверке" value={filteredWorks.filter((work) => work.status === "PENDING").length} tone="amber" />
                </div>
              </div>

              <div className="panel space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <select className="input" value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)}>
                    <option value="all">Все курсы</option>
                    {courses.map((course) => <option key={course} value={course}>{course}</option>)}
                  </select>
                  <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="all">Все статусы</option>
                    <option value="GRADED">Проверено</option>
                    <option value="PENDING">На проверке</option>
                    <option value="SUBMITTED">Сдано</option>
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      <tr>
                        <th className="px-4 py-3">Работа</th>
                        <th className="px-4 py-3">Курс</th>
                        <th className="px-4 py-3">Дата</th>
                        <th className="px-4 py-3">Оценка</th>
                        <th className="px-4 py-3">Из чего состоит</th>
                        <th className="px-4 py-3">Статус</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {filteredWorks.map((work) => (
                        <tr key={work.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/80">
                          <td className="px-4 py-4 font-semibold">{work.title}</td>
                          <td className="px-4 py-4 text-slate-500 dark:text-slate-300">{work.course}</td>
                          <td className="px-4 py-4 text-slate-500 dark:text-slate-300">{work.date}</td>
                          <td className="px-4 py-4 text-lg font-bold">{work.score == null ? "—" : `${work.score}%`}</td>
                          <td className="px-4 py-4 text-slate-500 dark:text-slate-300">{work.details}</td>
                          <td className="px-4 py-4"><StaffStatusBadge status={work.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredWorks.length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">По выбранным фильтрам работ нет.</p>}
              </div>
            </>
          ) : (
            <div className="panel text-sm text-slate-500">Выберите группу и ученика.</div>
          )}
        </main>
      </section>
    </div>
  );
}

function collectCourses(data) {
  const map = new Map();
  data.progress.forEach((item) => {
    if (item.course) map.set(item.course.id, item.course);
  });
  data.attempts.forEach((attempt) => {
    const course = attempt.test?.lesson?.module?.course;
    if (course) map.set(course.id, course);
  });
  return Array.from(map.values());
}

function buildRows(attempts, courseId) {
  const grouped = attempts
    .filter((attempt) => attempt.test?.lesson?.module?.course?.id === courseId)
    .reduce((map, attempt) => {
      const testId = attempt.testId;
      map.set(testId, [...(map.get(testId) || []), attempt]);
      return map;
    }, new Map());

  return Array.from(grouped.entries()).map(([testId, items]) => {
    const first = items[0];
    const graded = items.filter((attempt) => attempt.status === "GRADED");
    const best = graded.length ? graded.reduce((max, attempt) => (attempt.score > max.score ? attempt : max), graded[0]) : null;
    const pending = items.some((attempt) => attempt.status === "PENDING_REVIEW");
    const points = best
      ? `${best.earnedPoints || 0}/${best.totalPoints || 0}`
      : pending
        ? "ждёт ручной проверки"
        : "нет зачёта";

    return {
      testId,
      title: first.test?.title || "Тест",
      lessonTitle: first.test?.lesson?.title || "Урок",
      countedScore: best ? best.score : null,
      points,
      attemptCount: items.length,
      status: best ? "GRADED" : pending ? "PENDING_REVIEW" : "EMPTY"
    };
  });
}

function buildStudentWorks(data, student) {
  if (!data || !student) return [];

  const manualWorks = data.manualSubmissions
    .filter((item) => item.student?.id === student.id || item.studentId === student.id)
    .map((item) => ({
      id: item.id,
      title: item.testTitle,
      course: item.course?.title || "Курс",
      date: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("ru-RU") : "—",
      score: item.finalScore ?? null,
      status: item.status,
      details: item.status === "GRADED"
        ? `Автопроверка ${item.autoScore || 0} б. + ручная ${item.score || 0} б.`
        : "Ждёт ручной проверки"
    }));

  const gradeWorks = (student.grades || []).map((grade) => ({
    id: `grade-${student.id}-${grade.title}`,
    title: grade.title,
    course: findGradeCourse(student, grade.title),
    date: "—",
    score: grade.score,
    status: grade.details.some((detail) => String(detail.value).includes("На проверке")) ? "PENDING" : "GRADED",
    details: grade.details.map((detail) => `${detail.label}: ${detail.value}`).join("; ")
  }));

  const assignments = (student.assignments || []).map((assignment) => ({
    id: `assignment-${student.id}-${assignment.id}`,
    title: assignment.title,
    course: assignment.course,
    date: new Date(assignment.effectiveDate).toLocaleDateString("ru-RU"),
    score: null,
    status: assignment.submitted ? "SUBMITTED" : assignment.status,
    details: assignment.submitted ? "Задание сдано" : `Срок: ${new Date(assignment.effectiveDate).toLocaleDateString("ru-RU")}`
  }));

  const unique = new Map();
  [...manualWorks, ...gradeWorks, ...assignments].forEach((work) => {
    const key = `${work.title}-${work.course}`;
    const existing = unique.get(key);
    if (!existing || existing.status !== "PENDING") unique.set(key, work);
  });

  return Array.from(unique.values());
}

function findGradeCourse(student, title) {
  const assignment = (student.assignments || []).find((item) => item.title === title);
  return assignment?.course || student.strengthsByCourse?.[0]?.course || "Курс";
}

function SummaryCard({ icon: Icon, label, value, tone }) {
  const tones = {
    brand: "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-100",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-100",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-100"
  };

  return (
    <div className="panel flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const labels = {
    GRADED: "Засчитано",
    PENDING_REVIEW: "На проверке",
    EMPTY: "Нет зачёта"
  };
  const classes = {
    GRADED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-100",
    PENDING_REVIEW: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-100",
    EMPTY: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
  };

  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${classes[status]}`}>{labels[status]}</span>;
}

function StaffStatusBadge({ status }) {
  const labels = {
    GRADED: "Проверено",
    PENDING: "На проверке",
    SUBMITTED: "Сдано",
    OVERDUE: "Просрочено",
    EXTENDED: "Продлено",
    ACTIVE: "Активно"
  };
  const classes = {
    GRADED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-100",
    PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-100",
    SUBMITTED: "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-100",
    OVERDUE: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-100",
    EXTENDED: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-100",
    ACTIVE: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
  };

  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${classes[status] || classes.ACTIVE}`}>{labels[status] || status}</span>;
}
