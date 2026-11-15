export default function StatCard({ label, value, icon: Icon, trend }) {
  return (
    <div className="bg-gradient-to-br from-white via-[#FFFDF9] to-[#FFF8EB] border border-[#F5B900]/25 hover:border-[#F5B900]/50 rounded-2xl p-4 sm:p-5 md:p-6 flex items-center gap-3 sm:gap-4 shadow-[0_4px_20px_rgba(128,0,32,0.03)] hover:shadow-[0_10px_30px_rgba(128,0,32,0.08)] transition-all duration-300 select-none min-w-0 group hover:-translate-y-0.5">
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#800020]/10 to-[#F5B900]/15 text-[#800020] border border-[#F5B900]/30 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-300">
        {Icon && <Icon size={20} className="sm:w-5 sm:h-5 text-[#800020]" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9.5px] sm:text-[10px] font-bold text-[#A87900] tracking-[0.16em] uppercase font-sans truncate">{label}</p>
        <p className="text-xl sm:text-2xl font-serif font-bold text-[#800020] mt-0.5 truncate leading-tight tracking-tight">{value}</p>
        {trend && (
          <span className="inline-flex items-center gap-1 text-[8.5px] sm:text-[9.5px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-sans font-semibold mt-1 truncate max-w-full border border-emerald-200">
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}
