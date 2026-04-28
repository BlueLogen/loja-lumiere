import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { products, categories } from '../data/products'
import ProductCard from '../components/ProductCard'

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeCategory, setActiveCategory] = useState(searchParams.get('cat') || 'todos')
  const [sort, setSort] = useState('default')
  const query = searchParams.get('q') || ''

  useEffect(() => {
    const cat = searchParams.get('cat') || 'todos'
    setActiveCategory(cat)
  }, [searchParams])

  function selectCategory(id) {
    setActiveCategory(id)
    const params = {}
    if (id !== 'todos') params.cat = id
    if (query) params.q = query
    setSearchParams(params)
  }

  let filtered = activeCategory === 'todos' ? products : products.filter(p => p.category === activeCategory)
  if (query) filtered = filtered.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
  if (sort === 'price-asc') filtered = [...filtered].sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') filtered = [...filtered].sort((a, b) => b.price - a.price)

  return (
    <main className="products-page">
      {/* Sticky filter bar */}
      <div className="filter-bar">
        <div className="filter-bar__cats">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`filter-pill${activeCategory === cat.id ? ' active' : ''}`}
              onClick={() => selectCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="products-toolbar-mobile">
        <span className="products-count">{filtered.length} peças</span>
        <select value={sort} onChange={e => setSort(e.target.value)} className="sort-select">
          <option value="default">Relevância</option>
          <option value="price-asc">Menor preço</option>
          <option value="price-desc">Maior preço</option>
        </select>
      </div>

      {query && (
        <p className="search-label">Resultados para: <strong>"{query}"</strong></p>
      )}

      <div className="products__grid">
        {filtered.length > 0
          ? filtered.map(p => <ProductCard key={p.id} product={p} />)
          : <p className="empty-state">Nenhum produto encontrado.</p>
        }
      </div>
    </main>
  )
}
