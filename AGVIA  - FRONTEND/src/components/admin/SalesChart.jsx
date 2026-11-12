import React from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const FALLBACK_DATA = [
  { month: 'Apr', sales: 48000 },
  { month: 'May', sales: 67000 },
  { month: 'Jun', sales: 54000 },
  { month: 'Jul', sales: 89000 },
  { month: 'Aug', sales: 112000 },
  { month: 'Sep', sales: 95000 },
]

export default function SalesChart({ data = [], dataKey = 'sales', title = 'Sales Trend' }) {
  const safeData = Array.isArray(data) && data.length > 0 ? data : FALLBACK_DATA

  return (
    <div className="bg-white border border-[#C9A45C]/20 rounded-3xl p-4 sm:p-6 shadow-sm select-none min-w-0">
      <h3 className="font-serif text-base sm:text-lg text-[#5A1020] font-bold mb-4 uppercase tracking-wider">{title}</h3>
      <div className="w-full h-[280px] min-h-[280px] relative">
        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200}>
          <AreaChart data={safeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5A1020" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#5A1020" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#C9A45C22" vertical={false} />
            <XAxis 
              dataKey="month" 
              stroke="#211D1E" 
              opacity={0.4}
              fontSize={10} 
              tickLine={false}
              axisLine={false}
              dy={10}
              className="font-sans uppercase tracking-wider"
            />
            <YAxis 
              stroke="#211D1E" 
              opacity={0.4}
              fontSize={10} 
              tickLine={false}
              axisLine={false}
              dx={-10}
              className="font-sans"
              tickFormatter={(val) => `₹${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#FAF7F2', 
                border: '1px solid #C9A45C', 
                borderRadius: '16px',
                boxShadow: '0 10px 30px -10px rgba(90, 16, 32, 0.08)',
                fontFamily: 'Manrope, sans-serif',
                fontSize: '11px'
              }} 
              labelClassName="font-serif font-bold text-[#5A1020]"
            />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke="#5A1020" 
              strokeWidth={2} 
              fill="url(#salesFill)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
