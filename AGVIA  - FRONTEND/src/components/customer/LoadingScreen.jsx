import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BrandLogo from '../common/BrandLogo'
import { BUSINESS } from '../../constants/business'

export default function LoadingScreen({ onComplete }) {
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    const hasLoaded = sessionStorage.getItem('llw_app_loaded')
    const totalDuration = hasLoaded ? 200 : 450

    const timer = setTimeout(() => {
      sessionStorage.setItem('llw_app_loaded', 'true')
      setIsDone(true)
      if (onComplete) onComplete()
    }, totalDuration)

    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {!isDone && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.02,
            transition: { duration: 0.3, ease: 'easeInOut' },
          }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#FBF5EA] text-[#38271F] select-none overflow-hidden"
        >
          {/* Ambient Maroon & Antique Gold Glow */}
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#651B2B]/12 filter blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#B58A45]/20 filter blur-[100px] pointer-events-none" />

          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex flex-col items-center px-6 text-center"
          >
            <BrandLogo variant="light" size="xl" priority className="drop-shadow-[0_12px_30px_rgba(101,27,43,0.16)]" />
            <p className="mt-4 font-sans text-[10px] sm:text-xs tracking-[0.28em] uppercase text-[#651B2B] font-semibold">
              {BUSINESS.location.shortAddress}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
