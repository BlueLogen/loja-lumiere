export default function About() {
  return (
    <main className="about-page">
      <div className="page-hero">
        <img src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80" alt="Sobre" />
        <div className="page-hero__overlay" />
        <div className="page-hero__content">
          <p className="section-eyebrow">Nossa história</p>
          <h1>Sobre a Lumière</h1>
        </div>
      </div>

      <div className="about-section">
        <h2>Joias que carregam significado</h2>
        <p>A Lumière nasceu do sonho de criar joias que fossem além da beleza estética — peças que carregam memórias, celebram conquistas e expressam a essência de quem as usa.</p>
        <p>Cada joia é cuidadosamente desenvolvida por artesãos experientes, usando materiais de alta qualidade como ouro 18k, prata 925 e pedras preciosas selecionadas.</p>
        <p>Acreditamos que toda mulher merece se sentir especial todos os dias.</p>
      </div>

      <div className="about-values">
        {[
          { icon: '✦', title: 'Autenticidade', text: 'Certificado de autenticidade em cada peça.' },
          { icon: '♻️', title: 'Sustentabilidade', text: 'Materiais responsáveis e embalagens recicláveis.' },
          { icon: '🤝', title: 'Artesanato', text: 'Valorizamos artesãos e técnicas tradicionais.' },
          { icon: '💛', title: 'Inclusividade', text: 'Joias para todos os estilos e momentos.' },
        ].map(v => (
          <div key={v.title} className="value-card">
            <div className="value-card__icon">{v.icon}</div>
            <h3>{v.title}</h3>
            <p>{v.text}</p>
          </div>
        ))}
      </div>

      <div className="about-section">
        <h2>Garantias Lumière</h2>
        {[
          { icon: '🛡️', t: 'Garantia de 1 ano', d: 'Todas as peças com certificado e garantia total.' },
          { icon: '🚚', t: 'Frete grátis +R$299', d: 'Entrega rápida para todo o Brasil.' },
          { icon: '↩️', t: 'Devolução 30 dias', d: 'Troque ou devolva sem complicação.' },
          { icon: '💎', t: 'Peças certificadas', d: 'Materiais verificados e autênticos.' },
        ].map(g => (
          <div key={g.t} className="footer__guarantee" style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 20 }}>{g.icon}</span>
            <div>
              <strong style={{ fontSize: 13, display: 'block' }}>{g.t}</strong>
              <span style={{ fontSize: 12, color: '#757575' }}>{g.d}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
