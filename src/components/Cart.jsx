import { useCart } from '../context/CartContext'
import { useNavigate } from 'react-router-dom'

export default function Cart() {
  const { items, removeItem, updateQty, total, open, setOpen } = useCart()
  const navigate = useNavigate()

  return (
    <>
      <div className={`cart-overlay${open ? ' cart-overlay--visible' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`cart${open ? ' cart--open' : ''}`}>
        <div className="cart__header">
          <h2>Seu Carrinho</h2>
          <button className="cart__close" onClick={() => setOpen(false)} aria-label="Fechar">✕</button>
        </div>

        {items.length === 0 ? (
          <div className="cart__empty">
            <span>✦</span>
            <p>Seu carrinho está vazio</p>
            <button className="btn btn--outline" onClick={() => setOpen(false)}>Ver coleção</button>
          </div>
        ) : (
          <>
            <div className="cart__items">
              {items.map(item => (
                <div key={item.id} className="cart__item">
                  <img src={item.image} alt={item.name} />
                  <div className="cart__item-info">
                    <p className="cart__item-name">{item.name}</p>
                    <p className="cart__item-price">R$ {item.price.toFixed(2).replace('.', ',')}</p>
                    <div className="cart__item-qty">
                      <button onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
                      <span>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                    </div>
                  </div>
                  <button className="cart__item-remove" onClick={() => removeItem(item.id)} aria-label="Remover">✕</button>
                </div>
              ))}
            </div>

            <div className="cart__footer">
              <div className="cart__total">
                <span>Total</span>
                <strong>R$ {total.toFixed(2).replace('.', ',')}</strong>
              </div>
              <button className="btn btn--gold btn--full" onClick={() => { setOpen(false); navigate('/checkout') }}>Finalizar compra</button>
              <button className="btn btn--ghost btn--full" onClick={() => setOpen(false)}>Continuar comprando</button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
