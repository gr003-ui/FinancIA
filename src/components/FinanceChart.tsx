"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useFinanceStore } from '../store/useFinanceStore';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function FinanceChart() {
  const { transactions, exchangeRate } = useFinanceStore();

  const data = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: { name: string; value: number }[], curr) => {
      const val = curr.currency === 'USD' ? curr.amount * exchangeRate : curr.amount;
      const existing = acc.find(item => item.name === curr.method);
      if (existing) {
        existing.value += val;
      } else {
        acc.push({ name: curr.method, value: val });
      }
      return acc;
    }, []);

  if (data.length === 0) return (
    <div className="h-64 flex items-center justify-center text-slate-400 italic text-sm">
      Cargá gastos para ver el análisis
    </div>
  );

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          />
          <Legend iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}