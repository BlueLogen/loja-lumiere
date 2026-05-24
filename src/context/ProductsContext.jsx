import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { products as seedProducts } from '../data/products'

const ProductsContext = createContext()

const CATEGORIES = [
  { id: 'todos',     label: 'Todos' },
  { id: 'camisetas', label: 'Camisetas' },
  { id: 'colares',   label: 'Colares' },
  { id: 'brincos',   label: 'Brincos' },
  { id: 'aneis',     label: 'Anéis' },
  { id: 'pulseiras', label: 'Pulseiras' },
]

// ── Mapeamento DB (snake_case) ↔ App (camelCase) ──────────
function fromDB(p) {
  return {
    id:            p.id,
    name:          p.name,
    category:      p.category,
    price:         Number(p.price),
    originalPrice: p.original_price ? Number(p.original_price) : null,
    image:         p.image,
    images:        p.images || [p.image],
    description:   p.description,
    badge:         p.badge,
    badgeColor:    p.badge_color || '#c9a84c',
    featured:      p.featured,
    material:      p.material,
    stone:         p.stone,
    sizes:         p.sizes,
    sold:          p.sold,
  }
}

function toDB(p) {
  return {
    name:           p.name,
    category:       p.category,
    price:          Number(p.price),
    original_price: p.originalPrice ? Number(p.originalPrice) : null,
    image:          p.image,
    images:         p.images?.filter(Boolean) || [p.image],
    description:    p.description || '',
    badge:          p.badge || null,
    badge_color:    p.badgeColor || '#c9a84c',
    featured:       p.featured || false,
    material:       p.material || null,
    stone:          p.stone || null,
    sizes:          p.sizes?.length ? p.sizes : null,
    sold:           p.sold ? Number(p.sold) : null,
  }
}

// ── Provider ──────────────────────────────────────────────
export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => { fetchProducts() }, [])

  async function fetchProducts() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true })

      if (error) {
        console.error('[Supabase] Erro ao buscar produtos:', error.message)
        setProducts(seedProducts)
      } else if (data.length === 0) {
        await seedDatabase()
      } else {
        setProducts(data.map(fromDB))
      }
    } catch (err) {
      console.error('[Supabase] Falha de conexão:', err.message)
      setProducts(seedProducts)
    }
    setLoading(false)
  }

  async function seedDatabase() {
    const rows = seedProducts.map(toDB)
    const { data, error } = await supabase
      .from('products')
      .insert(rows)
      .select()

    if (error) {
      console.error('[Supabase] Erro ao semear produtos:', error.message)
      setProducts(seedProducts)
    } else {
      setProducts(data.map(fromDB))
    }
  }

  async function addProduct(product) {
    const { data, error } = await supabase
      .from('products')
      .insert(toDB(product))
      .select()
      .single()

    if (error) throw new Error(error.message)
    setProducts(prev => [...prev, fromDB(data)])
    return fromDB(data)
  }

  async function updateProduct(id, product) {
    const { data, error } = await supabase
      .from('products')
      .update(toDB(product))
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    setProducts(prev => prev.map(p => p.id === id ? fromDB(data) : p))
  }

  async function deleteProduct(id) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <ProductsContext.Provider
      value={{ products, loading, addProduct, updateProduct, deleteProduct, categories: CATEGORIES }}
    >
      {children}
    </ProductsContext.Provider>
  )
}

export const useProducts = () => useContext(ProductsContext)
