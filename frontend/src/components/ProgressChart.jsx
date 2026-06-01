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
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="progress" name="Прогресс" fill="#2563eb" radius={[6, 6, 0, 0]} />
          <Bar dataKey="score" name="Средний балл" fill="#10b981" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
