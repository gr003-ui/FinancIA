"use client";
import { useFinanceStore } from '../store/useFinanceStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DollarSign, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { transactions, exchangeRate, setExchangeRate } = useFinanceStore();

  const chartData = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: any[], curr) => {
      const val = curr.currency === 'USD' ? curr.amount * exchangeRate : curr.amount;
      const found = acc.find(i => i.name === curr.method);
      if (found) found.value += val;
      else acc.push({ name: curr.method, value: val });
      return acc;
    }, []);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
  const formatM = (v: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v);

  return (
    <div className="p-10 space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Cotización Dólar */}
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cotización USD/ARS</p>
          <div className="flex items-center gap-2 mt-4">
            <span className="text-4xl font-black text-emerald-500">$</span>
            <input 
              type="number" 
              className="text-4xl font-black w-full outline-none bg-transparent"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Gráfico de Torta Corregido */}
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 col-span-2 h-[350px]">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Distribución de Gastos (Pesificados)</p>
           <ResponsiveContainer width="100%" height="100%">
             <PieChart>
               <Pie data={chartData} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                 {chartData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
               </Pie>
               <Tooltip 
                 // CORRECCIÓN PARA EL ERROR TS(2322):
                 formatter={(value: any) => [formatM(Number(value)), "Total"]}
                 contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
               />
               <Legend verticalAlign="middle" align="right" layout="vertical" />
             </PieChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}