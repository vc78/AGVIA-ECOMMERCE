import { useState, useRef } from 'react'
import { Upload, Image as ImageIcon, Link as LinkIcon, Sparkles, Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export const DEFAULT_IMAGE_PRESETS = [
  { label: 'AGVIA Classic Silk Saree', url: '/images/classic_silk_saree.jpg' },
  { label: 'AGVIA Floral Organza Saree', url: '/images/floral_organza_saree.jpg' },
  { label: 'AGVIA Embroidered Anarkali Set', url: '/images/anarkali_set.jpg' },
  { label: 'AGVIA Everyday Kurta Set', url: '/images/everyday_kurta_set.jpg' },
  { label: 'AGVIA Festive Lehenga Set', url: '/images/festive_lehenga_set.jpg' },
  { label: 'AGVIA Embroidered Wedding Lehenga', url: '/images/wedding_lehenga.jpg' },
  { label: 'AGVIA Evening Gown', url: '/images/evening_gown.jpg' },
  { label: 'AGVIA Co-ord Set', url: '/images/coord_set.jpg' },
  { label: 'AGVIA Festive Kurti', url: '/images/festive_kurti.jpg' },
  { label: 'AGVIA Bridal Dupatta', url: '/images/bridal_dupatta.jpg' },
]

// Client-side image optimizer: downscales large photos and compresses into high-quality JPEG
function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Please select an image file (PNG, JPG, WEBP, or AVIF).'))
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read the local file.'))
    reader.onload = (event) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Failed to parse image from file.'))
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')

        // Fill background with white for transparent PNGs
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve({
          dataUrl,
          width,
          height,
          sizeBytes: Math.round((dataUrl.length * 3) / 4),
        })
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  })
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export default function ProductImagePicker({ value, onChange, presets = DEFAULT_IMAGE_PRESETS }) {
  const [tab, setTab] = useState(value && !value.startsWith('data:') && !presets.some(p => p.url === value) ? 'url' : 'upload')
  const [isDragging, setIsDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [fileDetails, setFileDetails] = useState(null)
  const fileInputRef = useRef(null)

  const isLocalData = value && value.startsWith('data:')

  const handleProcessFile = async (file) => {
    if (!file) return
    setProcessing(true)
    try {
      const result = await compressImage(file)
      setFileDetails({
        name: file.name,
        originalSize: file.size,
        optimizedSize: result.sizeBytes,
        dimensions: `${result.width}x${result.height}`
      })
      onChange(result.dataUrl)
      toast.success(`Image imported from device (${formatBytes(result.sizeBytes)})`, {
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Failed to process local image.')
    } finally {
      setProcessing(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0])
    }
  }

  const handleClear = () => {
    onChange('')
    setFileDetails(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-3 font-body">
      {/* Mode Selection Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-[#C9A45C]/20 pb-2">
        <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block select-none">
          Garment Visual Showcase *
        </label>
        <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-xl border border-[#C9A45C]/20">
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              tab === 'upload'
                ? 'bg-[#5A1020] text-white shadow-sm'
                : 'text-[#211D1E]/60 hover:text-[#5A1020]'
            }`}
          >
            <Upload size={11} /> Device Upload
          </button>
          <button
            type="button"
            onClick={() => setTab('url')}
            className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              tab === 'url'
                ? 'bg-[#5A1020] text-white shadow-sm'
                : 'text-[#211D1E]/60 hover:text-[#5A1020]'
            }`}
          >
            <LinkIcon size={11} /> Image URL
          </button>
          <button
            type="button"
            onClick={() => setTab('presets')}
            className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              tab === 'presets'
                ? 'bg-[#5A1020] text-white shadow-sm'
                : 'text-[#211D1E]/60 hover:text-[#5A1020]'
            }`}
          >
            <Sparkles size={11} /> Presets
          </button>
        </div>
      </div>

      {/* Tab 1: Local Device Upload */}
      {tab === 'upload' && (
        <div className="space-y-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleProcessFile(e.target.files[0])
              }
            }}
            accept="image/png,image/jpeg,image/jpg,image/webp,image/avif"
            className="hidden"
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 select-none ${
              isDragging
                ? 'border-[#5A1020] bg-[#5A1020]/10 scale-[1.01]'
                : value && isLocalData
                ? 'border-[#C9A45C] bg-[#FAF7F2]/80 hover:bg-[#FAF7F2]'
                : 'border-[#C9A45C]/40 bg-white hover:border-[#5A1020] hover:bg-[#FAF7F2]/40'
            }`}
          >
            {processing ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2">
                <Loader2 size={28} className="animate-spin text-[#5A1020]" />
                <span className="text-xs font-semibold text-[#5A1020]">Optimizing and importing garment photo...</span>
                <span className="text-[10px] text-[#211D1E]/50">Auto-compressing high-resolution asset for fast loading</span>
              </div>
            ) : value && isLocalData ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={value}
                    alt="Imported preview"
                    className="w-14 h-18 object-cover rounded-xl border border-[#C9A45C]/30 shadow-sm"
                  />
                  <div className="text-left">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 mb-1">
                      <CheckCircle2 size={10} /> Imported from device
                    </span>
                    <p className="text-xs font-semibold text-[#5A1020] line-clamp-1">
                      {fileDetails?.name || 'Local Garment Photo'}
                    </p>
                    <p className="text-[10px] text-[#211D1E]/50">
                      {fileDetails?.optimizedSize
                        ? `Optimized: ${formatBytes(fileDetails.optimizedSize)} (${fileDetails.dimensions})`
                        : 'Ready for atelier catalogue'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xl border border-[#C9A45C]/40 bg-white text-[#5A1020] hover:bg-[#FAF7F2] transition-colors"
                  >
                    Change Photo
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Remove Image"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-4 flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-[#5A1020]/5 text-[#5A1020] flex items-center justify-center border border-[#C9A45C]/30 mb-1">
                  <Upload size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#5A1020] hover:underline">
                    Click to import photo from your device
                  </span>
                  <span className="text-xs text-[#211D1E]/60"> or drag and drop</span>
                </div>
                <p className="text-[10px] text-[#211D1E]/50">
                  Supports JPG, PNG, WEBP, AVIF. Photos are automatically optimized for luxury web display.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Image URL */}
      {tab === 'url' && (
        <div className="space-y-2">
          <input
            name="image"
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
              setFileDetails(null)
            }}
            className="input-field"
            placeholder="https://example.com/images/couture-saree.jpg"
          />
          <p className="text-[10px] text-[#211D1E]/50">
            Paste a public web image URL or path within the boutique asset repository.
          </p>
        </div>
      )}

      {/* Tab 3: Presets */}
      {tab === 'presets' && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  onChange(p.url)
                  setFileDetails(null)
                }}
                className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                  value === p.url
                    ? 'border-[#5A1020] bg-[#5A1020]/5 ring-1 ring-[#5A1020]'
                    : 'border-[#C9A45C]/20 bg-white hover:border-[#5A1020]/40'
                }`}
              >
                <img
                  src={p.url}
                  alt={p.label}
                  className="w-full h-14 object-cover rounded-lg mb-1.5 border border-[#C9A45C]/15"
                />
                <span className="text-[9px] font-semibold text-[#211D1E] line-clamp-1">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
