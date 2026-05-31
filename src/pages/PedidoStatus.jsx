import { useSearchParams, Link } from 'react-router-dom'

const INFO = {
  aprovado: {
    icon: '✅',
    title: 'Pagamento aprovado!',
    sub: 'Seu pedido foi confirmado com sucesso. Em breve você receberá um e-mail.',
    color: '#22c55e',
  },
  aguardando: {
    icon: '⏳',
    title: 'Aguardando confirmação',
    sub: 'Seu pedido foi registrado. Assim que o pagamento for confirmado pelo Mercado Pago, você receberá um e-mail.',
    color: '#f59e0b',
  },
  pendente: {
    icon: '⏳',
    title: 'Pagamento em processamento',
    sub: 'Seu pedido foi recebido. O pagamento está sendo processado pelo Mercado Pago.',
    color: '#f59e0b',
  },
  recusado: {
    icon: '❌',
    title: 'Pagamento recusado',
    sub: 'Não foi possível processar o pagamento. Tente novamente com outro método.',
    color: '#ef4444',
  },
}

export default function PedidoStatus() {
  const [params] = useSearchParams()
  const status   = params.get('status') || 'pendente'
  const info     = INFO[status] || INFO.pendente

  return (
    <main style={{
      minHeight: '80vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 16, padding: '40px 32px',
        maxWidth: 480, width: '100%', textAlign: 'center',
        border: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{info.icon}</div>
        <h1 style={{
          fontFamily: 'var(--font-serif)', fontSize: '1.8rem',
          color: info.color, marginBottom: 12,
        }}>
          {info.title}
        </h1>
        <p style={{ color: 'var(--gray)', fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
          {info.sub}
        </p>

        {status === 'recusado' ? (
          <Link to="/checkout" className="btn btn--gold btn--full btn--lg">
            Tentar novamente
          </Link>
        ) : (
          <Link to="/" className="btn btn--gold btn--full btn--lg">
            Continuar comprando
          </Link>
        )}
      </div>
    </main>
  )
}
