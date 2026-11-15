export default function StatCard({ label, value, icon: Icon, trend }) {
  return (
    <div className="bg-white border border-[#C9A45C]/20 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 flex items-center gap-3 sm:gap-4 shadow-sm hover:shadow-md hover:border-[#C9A45C]/40 transition-all duration-300 select-none min-w-0">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#C9A45C]/10 text-[#C9A45C] border border-[#C9A45C]/15 flex items-center justify-center shrink-0">
        {Icon && <Icon size={18} className="sm:w-5 sm:h-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] sm:text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase font-sans truncate">{label}</p>
        <p className="text-xl sm:text-2xl font-serif font-bold text-[#5A1020] mt-0.5 truncate leading-tight">{value}</p>
        {trend && (
          <span className="inline-block text-[8.5px] sm:text-[9.5px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-sans font-semibold mt-1 truncate max-w-full border border-emerald-100">
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}
