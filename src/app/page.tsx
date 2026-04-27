"use client";
import { useFinanceStore } from '../store/useFinanceStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function Dashboard() {
  const { transactions, exchangeRate, setExchangeRate } = useFinanceStore();

  const chartData = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: { name: string; value: number }[], curr) => {
      const val = curr.currency === 'USD' ? curr.amount * exchangeRate : curr.amount;
      const found = acc.find(i => i.name === curr.method);
      if (found) found.value += val;
      else acc.push({ name: curr.method, value: val });
      return acc;
    }, []);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="p-10 space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Cotización Dólar */}
        <div className="bg-slate-900 p-8 rounded-[3rem] shadow-xl border border-white/10">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Cotización USD/ARS
          </p>
          <div className="flex items-center gap-2 mt-4">
            <span className="text-4xl font-black text-emerald-500">$</span>
            <input
              type="number"
              className="text-4xl font-black w-full outline-none bg-transparent text-white"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Gráfico de Torta */}
        <div className="bg-slate-900 p-8 rounded-[3rem] shadow-xl border border-white/10 col-span-2 h-[350px]">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">
            Distribución de Gastos (Pesificados)
          </p>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={80}
                outerRadius={110}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '1.5rem',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: '#0f172a',
                  color: '#f1f5f9',
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.4)',
                }}
              />
              <Legend
                verticalAlign="middle"
                align="right"
                layout="vertical"
                wrapperStyle={{ color: '#94a3b8' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}