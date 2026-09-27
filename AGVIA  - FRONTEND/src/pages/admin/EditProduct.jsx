import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import ProductImagePicker, { DEFAULT_IMAGE_PRESETS as IMAGE_PRESETS } from '../../components/admin/ProductImagePicker'
import { adminService } from '../../services/adminService'
import { productService } from '../../services/productService'
import { Image, Sparkles } from 'lucide-react'

export default function EditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    category: '',
    price: '',
    discountPrice: '',
    unit: 'piece',
    stock: '25',
    description: '',
    image: '',
    sku: '',
  })

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [cats, prod] = await Promise.all([
          adminService.getCategories().catch(() => []),
          productService.getById(id)
        ])

        setCategories(cats)

        if (prod) {
          const matchedCat = cats.find(c =>
            c.id === prod.categoryId ||
            c.name.toLowerCase() === (prod.category || prod.categoryName || '').toLowerCase()
          )

          setForm({
            name: prod.name || '',
            categoryId: matchedCat ? matchedCat.id : (cats[0]?.id || ''),
            category: matchedCat ? matchedCat.name : (prod.category || ''),
            price: prod.price ?? '',
            discountPrice: prod.discountPrice ?? '',
            unit: prod.unit || 'piece',
            stock: prod.stock ?? '25',
            description: prod.description || '',
            image: prod.image || IMAGE_PRESETS[0].url,
            sku: prod.sku || '',
          })
        }
      } catch (err) {
        console.error('Failed to load product data:', err)
        toast.error('Could not load silhouette details.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

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
      toast.error('Please select a valid category.')
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
      await adminService.updateProduct(id, {
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
      toast.success('Silhouette updated successfully!', {
        style: { background: '#5A1020', color: '#FAF7F2', borderRadius: '12px' }
      })
      navigate('/admin/products')
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Could not update silhouette. Please verify fields.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-24 text-center text-xs text-[#211D1E]/50 animate-pulse font-body">
          Retrieving silhouette data from AGVIA atelier repository...
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="mb-8 select-none font-body">
        <h2 className="font-serif text-3xl font-bold text-[#5A1020]">Edit Silhouette #{id}</h2>
        <p className="text-xs text-[#211D1E]/60 mt-1">Update details, pricing, and stock of this atelier garment.</p>
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
              <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block select-none">Couture Category *</label>
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

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#C9A45C] tracking-widest uppercase block select-none">
              Couture Description & Fabric Details
            </label>
            <textarea
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              className="input-field"
              placeholder="Detail the handloom weave, pure mulberry silk, zardozi embroidery, silhouette drape, and styling notes..."
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full sm:w-auto disabled:opacity-60 text-xs font-bold tracking-widest uppercase"
            >
              {saving ? 'Saving Updates...' : 'Save Silhouette Changes'}
            </button>
          </div>
        </form>

        {/* Live Preview Panel */}
        <div className="lg:col-span-4 select-none">
          <div className="bg-white border border-[#C9A45C]/20 rounded-3xl p-6 shadow-sm space-y-4 sticky top-28">
            <h3 className="font-serif text-sm tracking-widest uppercase font-bold text-[#5A1020] flex items-center gap-1.5 border-b border-[#C9A45C]/15 pb-3">
              <Sparkles size={14} className="text-[#C9A45C]" /> Storefront Preview
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

            <p className="text-[11px] text-[#211D1E]/70 line-clamp-3 leading-relaxed border-t border-[#C9A45C]/10 pt-3">
              {form.description || 'Silhouette craftsmanship notes and fabric drape will appear here.'}
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
