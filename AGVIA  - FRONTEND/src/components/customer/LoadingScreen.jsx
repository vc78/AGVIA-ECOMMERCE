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
              className="relative flex items-center justify-center"
            >
              <img 
                src="/images/agvia-logo.webp" 
                alt="AGVIA" 
                width={384}
                height={289}
                decoding="async"
                className="w-64 sm:w-80 md:w-96 max-w-[85vw] h-auto object-contain drop-shadow-[0_15px_40px_rgba(201,164,92,0.35)] select-none pointer-events-none brightness-105" 
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
