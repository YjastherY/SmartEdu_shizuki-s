import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function ProgressChart({ data }) {
  const chartData = data.map((item) => ({
    name: item.course.title,
    progress: item.percent,
    score: item.averageScore
  }));

  if (!chartData.length) {
    return <div className="panel text-sm text-slate-500">Прогресс появится после прохождения уроков.</div>;
  }

  return (
    <div className="panel h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "currentColor" }} className="text-slate-500 dark:text-slate-300" />
          <YAxis tick={{ fill: "currentColor" }} className="text-slate-500 dark:text-slate-300" />
          <Tooltip
            cursor={{ fill: "rgba(37, 99, 235, 0.08)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgb(51 65 85)",
              background: "rgb(15 23 42)",
              color: "rgb(241 245 249)",
              boxShadow: "0 18px 45px rgba(15, 23, 42, 0.28)"
            }}
            labelStyle={{ color: "rgb(241 245 249)", fontWeight: 700 }}
            itemStyle={{ color: "rgb(241 245 249)" }}
          />
          <Bar dataKey="progress" name="Прогресс" fill="#2563eb" radius={[6, 6, 0, 0]} />
          <Bar dataKey="score" name="Средний балл" fill="#10b981" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
