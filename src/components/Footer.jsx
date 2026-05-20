import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <div className="footer__logo">
            <img src="/logo.png" alt="Basic & Bijus" className="footer__logo-img" />
          </div>
          <p>Joias que contam histórias, beleza que ilumina momentos.</p>
          <div className="footer__socials">
            <a href="#" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
              </svg>
            </a>
            <a href="#" aria-label="Pinterest">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.04-2.83l1.22-5.15s-.31-.62-.31-1.54c0-1.45.84-2.53 1.88-2.53.89 0 1.32.67 1.32 1.47 0 .9-.57 2.23-.87 3.47-.25 1.04.52 1.88 1.54 1.88 1.85 0 3.09-2.37 3.09-5.17 0-2.14-1.44-3.63-3.5-3.63-2.38 0-3.78 1.79-3.78 3.63 0 .72.28 1.49.62 1.91.07.08.08.15.06.24l-.23.95c-.04.15-.13.18-.3.11C7.59 13.33 7 11.86 7 10.56c0-2.89 2.1-5.54 6.06-5.54 3.18 0 5.65 2.27 5.65 5.3 0 3.16-1.99 5.71-4.76 5.71-.93 0-1.8-.48-2.1-1.05l-.57 2.13c-.21.79-.76 1.79-1.13 2.39.85.26 1.75.4 2.68.4 5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="footer__links">
          <h4>Coleção</h4>
          <Link to="/produtos">Todos</Link>
          <Link to="/produtos?cat=colares">Colares</Link>
          <Link to="/produtos?cat=brincos">Brincos</Link>
          <Link to="/produtos?cat=aneis">Anéis</Link>
          <Link to="/produtos?cat=pulseiras">Pulseiras</Link>
        </div>

        <div className="footer__links">
          <h4>Ajuda</h4>
          <a href="#">FAQ</a>
          <a href="#">Trocas</a>
          <a href="#">Fale conosco</a>
          <a href="#">Rastrear pedido</a>
        </div>
      </div>

      <div className="footer__bottom">
        <p>© 2025 Lumière Joias · Feito com amor ✦</p>
      </div>
    </footer>
  )
}
