import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LoadingScreen({ onComplete }) {
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    const hasLoaded = sessionStorage.getItem('agvia_app_loaded')
    const totalDuration = hasLoaded ? 200 : 450

    const timer = setTimeout(() => {
      sessionStorage.setItem('agvia_app_loaded', 'true')
      setIsDone(true)
      if (onComplete) onComplete()
    }, totalDuration)

    return () => clearTimeout(timer)
  }, []) // Empty dependency array ensures timer runs reliably once on mount

  return (
    <AnimatePresence>
      {!isDone && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            scale: 1.02,
            transition: { duration: 0.3, ease: 'easeInOut' } 
          }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#1A0B10] text-[#FAF7F2] select-none overflow-hidden"
        >
          {/* Ambient Royal Gold & Burgundy Lighting Orbs */}
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#5A1020]/30 filter blur-[100px] pointer-events-none animate-pulse" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#C9A45C]/25 filter blur-[100px] pointer-events-none animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#E8C7C3]/10 filter blur-[80px] pointer-events-none" />

          {/* Luxury Monogram & Brand Logo */}
          <div className="relative z-10 flex flex-col items-center px-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1 
              }}
              transition={{ 
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1]
              }}
              className="relative flex flex-col items-center justify-center"
            >
              <img 
                src="/images/chitrika-logo.webp" 
                alt="CHITRIKA" 
                width={260}
                height={290}
                decoding="async"
                className="w-40 sm:w-48 md:w-56 h-auto object-contain drop-shadow-[0_15px_40px_rgba(201,164,92,0.4)] select-none pointer-events-none brightness-110 mb-3" 
              />
              <span className="font-serif text-2xl sm:text-3xl tracking-[0.24em] font-bold uppercase text-[#FAF7F2] leading-none">
                CHITRIKA
              </span>
              <span className="font-sans text-[8.5px] sm:text-[9.5px] tracking-[0.35em] uppercase text-[#C9A45C] font-semibold mt-2">
                WOMEN'S WEAR BOUTIQUE
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
