import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { products } from '../data/products'

function pad(n) { return String(n).padStart(2, '0') }

export default function FlashSale() {
  const [time, setTime] = useState({ h: 2, m: 9, s: 54 })

  useEffect(() => {
    const t = setInterval(() => {
      setTime(prev => {
        let { h, m, s } = prev
        s--
        if (s < 0) { s = 59; m-- }
        if (m < 0) { m = 59; h-- }
        if (h < 0) return { h: 0, m: 0, s: 0 }
        return { h, m, s }
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const flash = products.filter(p => p.originalPrice).slice(0, 4)

  return (
    <section className="flash-sale">
      <div className="flash-sale__header">
        <div className="flash-sale__title">
          <span className="flash-icon">⚡</span>
          <strong>OFERTAS RELÂMPAGO</strong>
        </div>
        <div className="flash-sale__timer">
          <span className="timer-block">{pad(time.h)}</span>
          <span className="timer-sep">:</span>
          <span className="timer-block">{pad(time.m)}</span>
          <span className="timer-sep">:</span>
          <span className="timer-block">{pad(time.s)}</span>
        </div>
        <Link to="/produtos" className="flash-sale__more">Ver Mais &rsaquo;</Link>
      </div>

      <div className="flash-sale__scroll">
        {flash.map(p => (
          <Link key={p.id} to={`/produto/${p.id}`} className="flash-item">
            <div className="flash-item__img">
              <img src={p.image} alt={p.name} />
              <span className="flash-item__off">
                -{Math.round((1 - p.price / p.originalPrice) * 100)}%
              </span>
            </div>
            <p className="flash-item__price">R$ {p.price.toFixed(2).replace('.', ',')}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
