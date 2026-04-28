import { createContext, useContext, useState, useEffect } from 'react'
import { products as defaultProducts } from '../data/products'

const ProductsContext = createContext()

const STORAGE_KEY = 'lumiere_products'
const NEXT_ID_KEY = 'lumiere_next_id'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function save(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
}

function getNextId() {
  const stored = localStorage.getItem(NEXT_ID_KEY)
  return stored ? Number(stored) : defaultProducts.length + 1
}

function bumpNextId(id) {
  localStorage.setItem(NEXT_ID_KEY, String(id + 1))
}

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(() => {
    const stored = load()
    if (stored) return stored
    // seed localStorage with defaults on first load
    save(defaultProducts)
    return defaultProducts
  })

  function persist(next) {
    setProducts(next)
    save(next)
  }

  function addProduct(data) {
    const id = getNextId()
    bumpNextId(id)
    const product = {
      ...data,
      id,
      images: data.images?.length ? data.images : [data.image],
    }
    persist([...products, product])
    return product
  }

  function updateProduct(id, data) {
    persist(products.map(p =>
      p.id === id
        ? { ...p, ...data, id, images: data.images?.length ? data.images : [data.image] }
        : p
    ))
  }

  function deleteProduct(id) {
    persist(products.filter(p => p.id !== id))
  }

  const categories = [
    { id: 'todos', label: 'Todos' },
    { id: 'camisetas', label: 'Camisetas' },
    { id: 'colares', label: 'Colares' },
    { id: 'brincos', label: 'Brincos' },
    { id: 'aneis', label: 'Anéis' },
    { id: 'pulseiras', label: 'Pulseiras' },
  ]

  return (
    <ProductsContext.Provider value={{ products, addProduct, updateProduct, deleteProduct, categories }}>
      {children}
    </ProductsContext.Provider>
  )
}

export const useProducts = () => useContext(ProductsContext)
