import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import ProductImagePicker, { DEFAULT_IMAGE_PRESETS as IMAGE_PRESETS } from '../../components/admin/ProductImagePicker'
import { adminService } from '../../services/adminService'
import { Image, Sparkles, Loader2, Wand2 } from 'lucide-react'

export default function AddProduct() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loadingCats, setLoadingCats] = useState(true)
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    category: '',
    price: '',
    discountPrice: '',
    unit: 'piece',
    stock: '25',
    description: '',
    image: IMAGE_PRESETS[0].url,
    sku: '',
  })
  const [saving, setSaving] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)

  useEffect(() => {
    adminService.getCategories()
      .then(cats => {
        setCategories(cats)
        if (cats.length > 0) {
          setForm(prev => ({
            ...prev,
            categoryId: cats[0].id,
            category: cats[0].name
          }))
        }
      })
      .catch(err => {
        console.error('Failed to load categories:', err)
        const defaultCats = [
          { id: 1, name: 'Sarees' },
          { id: 2, name: 'Lehengas' },
          { id: 3, name: 'Anarkalis & Kurtas' },
          { id: 4, name: 'Dresses & Gowns' },
          { id: 5, name: 'Wedding & Festive Edit' }
        ]
        setCategories(defaultCats)
        setForm(prev => ({ ...prev, categoryId: 1, category: defaultCats[0].name }))
      })
      .finally(() => setLoadingCats(false))
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'categoryId') {
      const selected = categories.find(c => String(c.id) === String(value))
      setForm(prev => ({
        ...prev,
        categoryId: value,
        category: selected ? selected.name : prev.category
      }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Please specify a silhouette name.')
      return
    }
    if (!form.categoryId) {
      toast.error('Please select a valid couture category.')
      return
    }
    if (Number(form.price) <= 0) {
      toast.error('Price must be greater than 0.')
      return
    }
    if (Number(form.stock) < 0) {
      toast.error('Stock quantity cannot be negative.')
      return
    }

    setSaving(true)
    try {
      await adminService.createProduct({
        name: form.name.trim(),
        categoryId: Number(form.categoryId),
        category: form.category,
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
        stock: Number(form.stock),
        unit: form.unit,
        description: form.description,
        image: form.image,
        sku: form.sku.trim() || undefined,
      })
      toast.success('Silhouette added successfully to atelier catalogue!', {
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
      navigate('/admin/products')
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Could not add silhouette. Please verify fields.')
    } finally {
      setSaving(false)
    }
  }

  const handleAiGenerate = async () => {
    if (!form.name.trim()) {
      toast.error('Enter a silhouette name first so AI can generate its description.')
      return
    }
    setAiGenerating(true)
    try {
      const selectedCat = categories.find(c => String(c.id) === String(form.categoryId))
      const result = await adminService.generateAiProductContent({
        name: form.name.trim(),
        category: selectedCat?.name || form.category || 'Women Fashion Couture',
        price: form.price ? `₹${form.price}` : '',
        weight: form.unit || 'piece',
        ingredients: 'Handloom Mulberry Silk, Metallic Zari, Zardozi Embroidery',
        characteristics: 'Bespoke tailoring, regal drape, Silk Mark certified, artisanal craftsmanship',
      })
      if (result?.description) {
        setForm(prev => ({ ...prev, description: result.description }))
        toast.success('AI couture description applied! Review and edit before saving.', {
          style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
        })
      } else {
        toast.error('AI did not return a description. Try again.')
      }
    } catch (err) {
      toast.error('AI generation failed. Check your network or GEMINI_API_KEY.')
    } finally {
      setAiGenerating(false)
    }
  }

  return (
    <AdminLayout>
      <div className="mb-8 select-none font-body">
        <h2 className="font-serif text-3xl font-bold text-[#5A1020]">Add New Silhouette</h2>
        <p className="text-xs text-[#211D1E]/60 mt-1">Introduce a new handcrafted luxury ensemble to the AGVIA atelier collection.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-body">
        <form onSubmit={handleSubmit} className="lg:col-span-8 bg-white border border-[#C9A45C]/20 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block select-none">Silhouette Title *</label>
            <input
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g. Royal Burgundy Kanjeevaram Silk Saree"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block select-none">
                Couture Category * {loadingCats && '(Loading...)'}
              </label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                required
                className="input-field bg-white font-medium cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block select-none">Unit / Packaging</label>
              <select name="unit" value={form.unit} onChange={handleChange} className="input-field bg-white cursor-pointer">
                <option value="piece">Per Piece</option>
                <option value="set">Per Set (Ensemble)</option>
                <option value="saree">Per Saree with Blouse</option>
                <option value="lehenga">Bridal Trousseau Box</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block select-none">Price (₹) *</label>
              <input
                name="price"
                type="number"
                min="1"
                step="0.01"
                required
                value={form.price}
                onChange={handleChange}
                className="input-field"
                placeholder="18500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block select-none">Stock Quantity *</label>
              <input
                name="stock"
                type="number"
                min="0"
                required
                value={form.stock}
                onChange={handleChange}
                className="input-field"
                placeholder="25"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block select-none">Special Offer Price (₹)</label>
              <input
                name="discountPrice"
                type="number"
                min="0"
                step="0.01"
                value={form.discountPrice}
                onChange={handleChange}
                className="input-field"
                placeholder="15900 (Optional)"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block select-none">SKU Identifier</label>
              <input
                name="sku"
                value={form.sku}
                onChange={handleChange}
                className="input-field"
                placeholder="AGV-SR-001 (Optional)"
              />
            </div>
          </div>

          {/* Garment Image Selection & Local Device Upload */}
          <ProductImagePicker
            value={form.image}
            onChange={(newImage) => setForm(prev => ({ ...prev, image: newImage }))}
            presets={IMAGE_PRESETS}
          />

          {/* Description & AI Generator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block select-none">
                Couture Description & Fabric Details
              </label>
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={aiGenerating}
                className="inline-flex items-center gap-1.5 text-[9px] font-bold text-[#5A1020] hover:text-[#C9A45C] bg-[#5A1020]/5 hover:bg-[#5A1020]/10 px-2.5 py-1 rounded-full border border-[#C9A45C]/30 uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {aiGenerating ? <Loader2 size={11} className="animate-spin text-[#5A1020]" /> : <Wand2 size={11} />}
                <span>{aiGenerating ? 'Generating Script via Gemini...' : 'Generate with AI'}</span>
              </button>
            </div>
            <textarea
              name="description"
              rows={8}
              value={form.description}
              onChange={handleChange}
              className="input-field leading-relaxed font-sans text-xs"
              placeholder="Click 'Generate with AI' to automatically write an opulent, multi-paragraph couture story covering heritage handloom weave, metallic zari borders, royal drape, styling, and heirloom care..."
            />
            {form.description ? (
              <div className="flex items-center justify-between text-[10px] text-[#5A1020] bg-[#5A1020]/5 px-3 py-1.5 rounded-xl border border-[#C9A45C]/30">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Sparkles size={11} className="text-[#C9A45C]" />
                  Haute Couture Script Generated via Google Gemini
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(form.description)
                    toast.success('Script copied to clipboard!')
                  }}
                  className="hover:underline font-bold text-[#5A1020]"
                >
                  Copy Script
                </button>
              </div>
            ) : (
              <p className="text-[9px] text-[#211D1E]/50">
                AI generates a detailed couture script with heritage weave notes, drape aesthetics, and bridal styling.
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full sm:w-auto disabled:opacity-60 text-xs font-bold tracking-widest uppercase"
            >
              {saving ? 'Registering Silhouette...' : 'Publish Silhouette to Atelier'}
            </button>
          </div>
        </form>

        {/* Live Preview Panel */}
        <div className="lg:col-span-4 select-none">
          <div className="bg-white border border-[#C9A45C]/20 rounded-3xl p-6 shadow-sm space-y-4 sticky top-28">
            <h3 className="font-serif text-sm tracking-widest uppercase font-bold text-[#5A1020] flex items-center gap-1.5 border-b border-[#C9A45C]/15 pb-3">
              <Sparkles size={14} className="text-[#C9A45C]" /> Live Boutique Preview
            </h3>

            <div className="rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#C9A45C]/15 h-56 flex items-center justify-center relative">
              {form.image ? (
                <img
                  src={form.image}
                  alt={form.name || 'Preview'}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = '/images/classic_silk_saree.jpg' }}
                />
              ) : (
                <div className="text-center text-[#211D1E]/40 flex flex-col items-center">
                  <Image size={24} className="mb-1" />
                  <span className="text-[10px]">No image selected</span>
                </div>
              )}
              {form.discountPrice && Number(form.discountPrice) < Number(form.price) && (
                <span className="absolute top-2 left-2 bg-[#5A1020] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                  OFFER
                </span>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-bold text-[#C9A45C] tracking-widest uppercase">
                {form.category || 'Couture Line'}
              </span>
              <h4 className="font-serif font-bold text-base text-[#5A1020] line-clamp-1">
                {form.name || 'Silhouette Name'}
              </h4>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-lg font-bold text-[#5A1020]">
                  ₹{form.discountPrice ? Number(form.discountPrice).toLocaleString('en-IN') : (Number(form.price) || 0).toLocaleString('en-IN')}
                </span>
                {form.discountPrice && (
                  <span className="text-xs text-[#211D1E]/40 line-through">
                    ₹{Number(form.price || 0).toLocaleString('en-IN')}
                  </span>
                )}
                <span className="text-[10px] text-[#211D1E]/50">/ {form.unit}</span>
              </div>
            </div>

            <div className="border-t border-[#C9A45C]/10 pt-3">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#C9A45C] block mb-1">
                Couture Story & Script:
              </span>
              <p className="text-[11px] text-[#211D1E]/75 line-clamp-6 leading-relaxed whitespace-pre-line font-sans">
                {form.description || 'Silhouette craftsmanship notes, weave artistry, and fabric drape will appear here.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
