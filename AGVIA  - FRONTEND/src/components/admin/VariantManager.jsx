import { useState, useRef } from 'react'
import {
  Plus,
  Trash2,
  Copy,
  Star,
  ChevronDown,
  ChevronUp,
  Upload,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Layers,
  Palette
} from 'lucide-react'
import toast from 'react-hot-toast'

const PRESET_SWATCHES = [
  { name: 'Emerald Green', hex: '#1B4D3E' },
  { name: 'Royal Maroon', hex: '#800020' },
  { name: 'Royal Blue', hex: '#2A52BE' },
  { name: 'Rani Pink', hex: '#E75480' },
  { name: 'Regal Purple', hex: '#4B0082' },
  { name: 'Mustard Gold', hex: '#D4AF37' },
  { name: 'Crimson Red', hex: '#9B111E' },
  { name: 'Midnight Black', hex: '#1C1C1C' },
  { name: 'Ivory White', hex: '#FFFFF0' },
  { name: 'Pastel Peach', hex: '#FFE5B4' },
]

function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Please upload a JPG, PNG or WebP image.'))
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

export default function VariantManager({
  variants = [],
  onChange,
  hasVariants = false,
  onToggleHasVariants,
  baseSku = '',
  basePrice = '',
  basePaymentOption = 'COD_AND_ONLINE'
}) {
  const [expandedIndex, setExpandedIndex] = useState(0)
  const [confirmDeleteImg, setConfirmDeleteImg] = useState(null) // { variantIdx, imgIdx }
  const [uploadProgress, setUploadProgress] = useState(null) // { current, total, text }
  const fileInputRefs = useRef({})

  const handleAddVariant = (preset = null) => {
    const nextIdx = variants.length + 1
    const colorName = preset ? preset.name : `Color Variant ${nextIdx}`
    const colorCode = preset ? preset.hex : '#800020'
    const colorCodeShort = colorName.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()
    const autoSku = baseSku ? `${baseSku}-${colorCodeShort}-${String(nextIdx).padStart(2, '0')}` : `AGV-${colorCodeShort}-${Date.now().toString().slice(-4)}`

    const newVariant = {
      colorName,
      colorCode,
      sku: autoSku,
      price: basePrice || '',
      discountPrice: '',
      stockQuantity: 10,
      lowStockThreshold: 5,
      paymentOption: basePaymentOption,
      active: true,
      images: []
    }

    const updated = [...variants, newVariant]
    onChange(updated)
    setExpandedIndex(updated.length - 1)
  }

  const handleDuplicateVariant = (idx) => {
    const target = variants[idx]
    if (!target) return

    const randomSuffix = Math.floor(100 + Math.random() * 900)
    const duplicated = {
      ...target,
      id: undefined,
      colorName: `${target.colorName} (Copy)`,
      sku: `${target.sku}-CP${randomSuffix}`,
      images: target.images.map(img => ({ ...img, id: undefined }))
    }

    const updated = [...variants, duplicated]
    onChange(updated)
    setExpandedIndex(updated.length - 1)
    toast.success(`Duplicated variant created with new unique SKU: ${duplicated.sku}`)
  }

  const handleDeleteVariant = (idx) => {
    if (variants.length <= 1) {
      toast.error('You need at least one variant when variants mode is enabled.')
      return
    }
    const updated = variants.filter((_, i) => i !== idx)
    onChange(updated)
    if (expandedIndex >= updated.length) {
      setExpandedIndex(Math.max(0, updated.length - 1))
    }
  }

  const handleUpdateVariantField = (idx, field, value) => {
    const updated = [...variants]
    updated[idx] = { ...updated[idx], [field]: value }
    onChange(updated)
  }

  // Multi-image upload
  const handleFilesUpload = async (variantIdx, files) => {
    if (!files || files.length === 0) return
    const fileList = Array.from(files)

    const updated = [...variants]
    const currentImages = [...(updated[variantIdx].images || [])]

    setUploadProgress({ current: 0, total: fileList.length, text: `Uploading 0 of ${fileList.length}...` })

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      try {
        setUploadProgress({
          current: i + 1,
          total: fileList.length,
          text: `Uploading ${i + 1} of ${fileList.length}...`
        })
        const res = await compressImage(file)
        const isPrimary = currentImages.length === 0 && i === 0
        currentImages.push({
          imageUrl: res.dataUrl,
          altText: `${updated[variantIdx].colorName} - View ${currentImages.length + 1}`,
          sortOrder: currentImages.length,
          isPrimary: isPrimary
        })
      } catch (err) {
        toast.error(`File ${file.name}: ${err.message || 'Please upload a JPG, PNG or WebP image.'}`)
      }
    }

    setUploadProgress(null)
    updated[variantIdx].images = currentImages
    onChange(updated)
    toast.success(`${fileList.length} image(s) processed and added to ${updated[variantIdx].colorName}!`)
  }

  const handleSetPrimaryImage = (variantIdx, imgIdx) => {
    const updated = [...variants]
    const imgs = updated[variantIdx].images.map((img, i) => ({
      ...img,
      isPrimary: i === imgIdx
    }))
    updated[variantIdx].images = imgs
    onChange(updated)
  }

  const handleMoveImage = (variantIdx, imgIdx, direction) => {
    const updated = [...variants]
    const imgs = [...updated[variantIdx].images]
    const targetIdx = imgIdx + direction
    if (targetIdx < 0 || targetIdx >= imgs.length) return

    const temp = imgs[imgIdx]
    imgs[imgIdx] = imgs[targetIdx]
    imgs[targetIdx] = temp

    // Reassign sort orders
    imgs.forEach((img, i) => { img.sortOrder = i })
    updated[variantIdx].images = imgs
    onChange(updated)
  }

  const handleDeleteImage = () => {
    if (!confirmDeleteImg) return
    const { variantIdx, imgIdx } = confirmDeleteImg
    const updated = [...variants]
    const imgs = [...updated[variantIdx].images]

    const wasPrimary = imgs[imgIdx]?.isPrimary
    imgs.splice(imgIdx, 1)

    // Delete safety rule: If deleted image was primary, automatically select another available image as primary!
    if (wasPrimary && imgs.length > 0) {
      imgs[0].isPrimary = true
    }

    imgs.forEach((img, i) => { img.sortOrder = i })
    updated[variantIdx].images = imgs
    onChange(updated)
    setConfirmDeleteImg(null)
    toast.success('Image removed from variant.')
  }

  return (
    <div className="border border-[#C9A45C]/30 rounded-2xl sm:rounded-3xl p-5 md:p-7 bg-[#FAF7F2]/60 space-y-6 font-body">
      {/* Switch Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#C9A45C]/20">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#5A1020]" />
            <h3 className="font-serif text-lg md:text-xl font-bold text-[#5A1020]">Product Variants & Color System</h3>
          </div>
          <p className="text-xs text-[#211D1E]/60 mt-0.5">
            Manage multiple shades (e.g. Green, Maroon, Royal Blue) with dedicated galleries, stock, and pricing.
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-[#C9A45C]/30 shadow-xs">
          <span className={`text-xs font-bold transition-colors ${!hasVariants ? 'text-[#5A1020]' : 'text-gray-400'}`}>
            Simple Product
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={hasVariants}
            onClick={() => {
              const next = !hasVariants
              onToggleHasVariants(next)
              if (next && variants.length === 0) {
                handleAddVariant(PRESET_SWATCHES[0])
              }
            }}
            className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
              hasVariants ? 'bg-[#5A1020]' : 'bg-gray-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                hasVariants ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-xs font-bold transition-colors ${hasVariants ? 'text-[#5A1020]' : 'text-gray-400'}`}>
            With Variants
          </span>
        </div>
      </div>

      {hasVariants && (
        <div className="space-y-4">
          {/* Preset Swatches Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#C9A45C]/20">
            <div className="text-[10px] font-bold text-[#C9A45C] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              Quick Add Royal Palettes:
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_SWATCHES.map((swatch) => (
                <button
                  key={swatch.name}
                  type="button"
                  onClick={() => handleAddVariant(swatch)}
                  className="inline-flex items-center gap-1.5 text-xs bg-[#FAF7F2] hover:bg-[#5A1020] hover:text-white px-2.5 py-1 rounded-full border border-[#C9A45C]/30 transition-all text-[#211D1E] cursor-pointer"
                >
                  <span
                    className="w-3 h-3 rounded-full border border-black/20"
                    style={{ backgroundColor: swatch.hex }}
                  />
                  <span>+ {swatch.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Progress Alert */}
          {uploadProgress && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-600 border-t-transparent" />
              <span>{uploadProgress.text}</span>
            </div>
          )}

          {/* Variant Cards List */}
          <div className="space-y-4">
            {variants.map((variant, idx) => {
              const isExpanded = expandedIndex === idx
              const primaryImg = variant.images?.find(img => img.isPrimary) || variant.images?.[0]

              return (
                <div
                  key={idx}
                  className={`border rounded-2xl overflow-hidden transition-all duration-200 bg-white ${
                    isExpanded
                      ? 'border-[#5A1020] shadow-md ring-1 ring-[#5A1020]/20'
                      : 'border-[#C9A45C]/30 hover:border-[#C9A45C]'
                  }`}
                >
                  {/* Accordion Header */}
                  <div
                    onClick={() => setExpandedIndex(isExpanded ? -1 : idx)}
                    className="p-4 flex items-center justify-between cursor-pointer select-none bg-linear-to-r from-white to-[#FAF7F2]/40"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-5 h-5 rounded-full border border-black/20 shadow-xs inline-block shrink-0"
                        style={{ backgroundColor: variant.colorCode || '#800020' }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-sm text-[#211D1E]">
                            {variant.colorName || `Variant ${idx + 1}`}
                          </span>
                          <span className="text-[10px] bg-[#FAF7F2] text-[#5A1020] border border-[#C9A45C]/30 px-2 py-0.5 rounded-full font-mono">
                            {variant.sku || 'No SKU'}
                          </span>
                          {variant.stockQuantity <= (variant.lowStockThreshold || 5) && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
                              Low Stock ({variant.stockQuantity})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#211D1E]/60 flex items-center gap-3 mt-0.5">
                          <span>₹{variant.price || basePrice || '0'}</span>
                          <span>•</span>
                          <span>Stock: {variant.stockQuantity}</span>
                          <span>•</span>
                          <span>{variant.images?.length || 0} Images</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {primaryImg && (
                        <img
                          src={primaryImg.imageUrl}
                          alt={variant.colorName}
                          className="w-8 h-8 rounded-lg object-cover border border-[#C9A45C]/30"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => handleDuplicateVariant(idx)}
                        title="Duplicate Variant"
                        className="p-1.5 text-gray-500 hover:text-[#5A1020] hover:bg-[#FAF7F2] rounded-lg transition-colors cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteVariant(idx)}
                        title="Delete Variant"
                        className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedIndex(isExpanded ? -1 : idx)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Accordion Content Body */}
                  {isExpanded && (
                    <div className="p-5 border-t border-gray-100 space-y-6 bg-white">
                      {/* Row 1: Color Name, Hex Code, SKU */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#C9A45C] uppercase tracking-wider block">
                            Color Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={variant.colorName}
                            onChange={(e) => handleUpdateVariantField(idx, 'colorName', e.target.value)}
                            placeholder="e.g. Royal Maroon"
                            className="input-field text-sm"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#C9A45C] uppercase tracking-wider block">
                            Color Code (HEX)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={variant.colorCode || '#800020'}
                              onChange={(e) => handleUpdateVariantField(idx, 'colorCode', e.target.value)}
                              className="w-10 h-10 p-0 border border-[#C9A45C]/30 rounded-lg cursor-pointer bg-transparent"
                            />
                            <input
                              type="text"
                              value={variant.colorCode || ''}
                              onChange={(e) => handleUpdateVariantField(idx, 'colorCode', e.target.value)}
                              placeholder="#800020"
                              className="input-field text-sm font-mono uppercase"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#C9A45C] uppercase tracking-wider block">
                            Variant SKU * (Must be Unique)
                          </label>
                          <input
                            type="text"
                            required
                            value={variant.sku}
                            onChange={(e) => handleUpdateVariantField(idx, 'sku', e.target.value.toUpperCase())}
                            placeholder="e.g. AGV-MRN-001"
                            className="input-field text-sm font-mono"
                          />
                        </div>
                      </div>

                      {/* Row 2: Price, Stock, Low Stock Alert, Payment */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#C9A45C] uppercase tracking-wider block">
                            Variant Price (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={variant.price}
                            onChange={(e) => handleUpdateVariantField(idx, 'price', e.target.value)}
                            placeholder={basePrice ? `Inherits ₹${basePrice}` : 'Price'}
                            className="input-field text-sm font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#C9A45C] uppercase tracking-wider block">
                            Stock Quantity *
                          </label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={variant.stockQuantity}
                            onChange={(e) => handleUpdateVariantField(idx, 'stockQuantity', Number(e.target.value))}
                            placeholder="10"
                            className="input-field text-sm font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#C9A45C] uppercase tracking-wider block">
                            Low Stock Alert Threshold
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={variant.lowStockThreshold}
                            onChange={(e) => handleUpdateVariantField(idx, 'lowStockThreshold', Number(e.target.value))}
                            placeholder="5"
                            className="input-field text-sm font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#C9A45C] uppercase tracking-wider block">
                            Payment Method
                          </label>
                          <select
                            value={variant.paymentOption || ''}
                            onChange={(e) => handleUpdateVariantField(idx, 'paymentOption', e.target.value || null)}
                            className="input-field text-sm bg-white cursor-pointer"
                          >
                            <option value="">Inherit Product Rule</option>
                            <option value="COD_AND_ONLINE">COD + Online</option>
                            <option value="ONLINE_ONLY">Online Only (Prepaid)</option>
                            <option value="COD_ONLY">COD Only</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 3: Multi-Image Section */}
                      <div className="space-y-3 pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-[#5A1020] uppercase tracking-wider block">
                              Variant Images ({variant.images?.length || 0})
                            </span>
                            <span className="text-[11px] text-[#211D1E]/60">
                              Upload multiple views (Pallu, Border, Pleats, Fabric close-up). Drag/reorder and mark one as ★ Primary.
                            </span>
                          </div>

                          <div>
                            <input
                              type="file"
                              multiple
                              accept="image/png,image/jpeg,image/webp,image/avif"
                              ref={(el) => { fileInputRefs.current[idx] = el }}
                              onChange={(e) => handleFilesUpload(idx, e.target.files)}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRefs.current[idx]?.click()}
                              className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#5A1020] hover:bg-[#72152b] text-white px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>+ Add Multiple Images</span>
                            </button>
                          </div>
                        </div>

                        {/* Image Grid */}
                        {variant.images && variant.images.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {variant.images.map((img, imgIdx) => (
                              <div
                                key={imgIdx}
                                className={`relative group rounded-xl overflow-hidden border bg-gray-50 transition-all ${
                                  img.isPrimary
                                    ? 'border-[#5A1020] ring-2 ring-[#5A1020]/20 shadow-md'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <img
                                  src={img.imageUrl}
                                  alt={img.altText || variant.colorName}
                                  className="w-full h-28 object-cover"
                                />

                                {/* Primary Badge */}
                                {img.isPrimary && (
                                  <div className="absolute top-1.5 left-1.5 bg-[#5A1020] text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                                    <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                                    <span>Primary</span>
                                  </div>
                                )}

                                {/* Image Controls Overlay */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                                  <div className="flex justify-between items-center">
                                    <button
                                      type="button"
                                      onClick={() => handleSetPrimaryImage(idx, imgIdx)}
                                      title={img.isPrimary ? 'Primary Image' : 'Set as Primary'}
                                      className={`p-1 rounded-full ${
                                        img.isPrimary ? 'bg-amber-400 text-black' : 'bg-white/80 text-black hover:bg-white'
                                      } transition-colors cursor-pointer`}
                                    >
                                      <Star className="w-3.5 h-3.5 fill-current" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteImg({ variantIdx: idx, imgIdx })}
                                      title="Remove Image"
                                      className="p-1 rounded-full bg-red-600/90 text-white hover:bg-red-700 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Reorder Arrows */}
                                  <div className="flex justify-between items-center">
                                    <button
                                      type="button"
                                      disabled={imgIdx === 0}
                                      onClick={() => handleMoveImage(idx, imgIdx, -1)}
                                      className="p-1 rounded bg-white/80 text-black hover:bg-white disabled:opacity-30 cursor-pointer"
                                    >
                                      <ArrowLeft className="w-3 h-3" />
                                    </button>
                                    <span className="text-[10px] text-white font-mono">#{imgIdx + 1}</span>
                                    <button
                                      type="button"
                                      disabled={imgIdx === variant.images.length - 1}
                                      onClick={() => handleMoveImage(idx, imgIdx, 1)}
                                      className="p-1 rounded bg-white/80 text-black hover:bg-white disabled:opacity-30 cursor-pointer"
                                    >
                                      <ArrowRight className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div
                            onClick={() => fileInputRefs.current[idx]?.click()}
                            className="border-2 border-dashed border-[#C9A45C]/30 hover:border-[#5A1020] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-[#FAF7F2]/30"
                          >
                            <Upload className="w-6 h-6 text-[#C9A45C] mx-auto mb-1.5" />
                            <div className="text-xs font-bold text-[#5A1020]">No images attached yet for this color</div>
                            <div className="text-[11px] text-[#211D1E]/60 mt-0.5">
                              Click or drag & drop 5–10 photos (JPG, PNG, WebP)
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Add Variant Button */}
          <button
            type="button"
            onClick={() => handleAddVariant()}
            className="w-full py-3 border-2 border-dashed border-[#5A1020]/30 hover:border-[#5A1020] rounded-2xl text-xs font-bold text-[#5A1020] hover:bg-[#5A1020]/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Another Color Variant</span>
          </button>
        </div>
      )}

      {/* Delete Image Confirmation Dialog */}
      {confirmDeleteImg && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#C9A45C]/30 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              <h4 className="font-serif font-bold text-base text-[#5A1020]">Remove Variant Image?</h4>
            </div>
            <p className="text-xs text-[#211D1E]/70 leading-relaxed">
              Are you sure you want to remove this photo? If it is currently the primary image, another photo in this variant will automatically become the primary thumbnail.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteImg(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteImage}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
