import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()
const CART_KEY = 'bb_cart'

function loadCart() {
  try {
    const saved = localStorage.getItem(CART_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function saveCart(items) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  } catch {}
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)
  const [open,  setOpen]  = useState(false)

  // Persiste no localStorage sempre que o carrinho mudar
  useEffect(() => {
    saveCart(items)
  }, [items])

  function addItem(product) {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id && i.selectedSize === product.selectedSize)
      if (existing) {
        return prev.map(i =>
          i.id === product.id && i.selectedSize === product.selectedSize
            ? { ...i, qty: i.qty + 1 }
            : i
        )
      }
      return [...prev, { ...product, qty: 1 }]
    })
    setOpen(true)
  }

  function removeItem(id) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function updateQty(id, qty) {
    if (qty < 1) return removeItem(id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
  }

  function clearCart() {
    setItems([])
    localStorage.removeItem(CART_KEY)
  }

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const count = items.reduce((sum, i) => sum + i.qty, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, count, open, setOpen }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
