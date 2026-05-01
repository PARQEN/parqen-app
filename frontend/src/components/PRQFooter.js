import { useNavigate } from 'react-router-dom';

const SOCIALS = [
  { label:'X',         href:'https://x.com/praqen',            icon:'𝕏'  },
  { label:'Instagram', href:'https://instagram.com/praqen',     icon:'📸' },
  { label:'Telegram',  href:'https://t.me/praqen',              icon:'💬' },
  { label:'Discord',   href:'https://discord.gg/praqen',        icon:'🎮' },
  { label:'WhatsApp',  href:'https://chat.whatsapp.com/praqen', icon:'🟢' },
];

const STEPS = [
  { icon:'🔍', step:'01', title:'Find Trusted Offer',  desc:'Browse listings & check seller profile, ratings & verified status' },
  { icon:'💳', step:'02', title:'Select Payment',      desc:'Pick MTN MoMo, Bank or any preferred payment option' },
  { icon:'⚡', step:'03', title:'Open Trade · 1 Min',  desc:'Funds locked in escrow instantly — safe & automatic' },
  { icon:'₿',  step:'04', title:'BTC in Your Wallet',  desc:'Confirm payment · BTC released free to any wallet of your choice' },
];

export default function PRQFooter() {
  const nav = useNavigate();

  return (
    <div className="pb-16 md:pb-0" style={{
      background: 'linear-gradient(160deg,#040f08 0%,#0c2218 45%,#163d28 100%)',
      fontFamily: "'DM Sans',sans-serif",
      borderTop: '1px solid rgba(64,145,108,0.3)',
      width: '100%',
      boxSizing: 'border-box',
      overflowX: 'hidden',
    }}>

      {/* ── How to Buy — 4 step cards ── */}
      <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', boxSizing: 'border-box' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9, minWidth: 0 }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: 1.1, whiteSpace: 'nowrap' }}>
            How to Buy Bitcoin
          </span>
          <span style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.06)', minWidth: 0 }}/>
          <span style={{
            fontSize: 9, fontWeight: 800, color: '#6EE7B7',
            background: 'rgba(64,145,108,0.2)', border: '1px solid rgba(64,145,108,0.35)',
            borderRadius: 5, padding: '2px 7px', whiteSpace: 'nowrap', flexShrink: 0,
          }}>Done in 60 sec ⚡</span>
        </div>

        {/* 2-col on phone, 4-col on wider screens */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 7,
          width: '100%',
          boxSizing: 'border-box',
        }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{
              background: 'rgba(45,106,79,0.15)',
              border: '1px solid rgba(64,145,108,0.22)',
              borderRadius: 10,
              padding: '9px 10px',
              position: 'relative',
              overflow: 'hidden',
              boxSizing: 'border-box',
              minWidth: 0,
            }}>
              <span style={{
                position: 'absolute', top: 4, right: 7,
                fontSize: 18, fontWeight: 900, color: 'rgba(64,145,108,0.1)',
                lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
              }}>{s.step}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>{s.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 900, color: '#6EE7B7', lineHeight: 1.2, minWidth: 0 }}>{s.title}</span>
              </div>
              <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.42)', fontWeight: 500, lineHeight: 1.45 }}>
                {s.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Promo strip */}
        <div style={{
          marginTop: 9,
          padding: '7px 10px',
          background: 'rgba(244,164,34,0.07)',
          border: '1px solid rgba(244,164,34,0.15)',
          borderRadius: 8,
          boxSizing: 'border-box',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 12, flexShrink: 0 }}>🚀</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#F4A422' }}>Be the first to create your offer</span>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.42)', fontWeight: 600, lineHeight: 1.5, marginBottom: 7 }}>
            Sell to MTN MoMo or Bank Account — instant payout in 1 min.
            Send BTC free to any wallet of your choice.
          </div>
          <button
            onClick={() => nav('/create-offer')}
            style={{
              width: '100%',
              padding: '7px 0', borderRadius: 8,
              border: '1px solid rgba(244,164,34,0.4)',
              background: 'rgba(244,164,34,0.12)',
              color: '#F4A422', fontWeight: 800, fontSize: 11, cursor: 'pointer',
              boxSizing: 'border-box',
            }}>
            + Create Your Offer Now
          </button>
        </div>
      </div>

      {/* ── Tagline + Buy CTA ── */}
      <div style={{
        padding: '10px 14px 0',
        boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '3px 6px', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap' }}>Keep Trading.</span>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#F4A422', whiteSpace: 'nowrap' }}>Keep Growing.</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.38)' }}>· Africa's most trusted P2P platform · Start in 30 sec</span>
        </div>
        <button
          onClick={() => nav('/buy-bitcoin')}
          style={{
            width: '100%',
            padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#2D6A4F,#40916C)',
            color: '#fff', fontWeight: 800, fontSize: 12,
            boxShadow: '0 2px 10px rgba(45,106,79,0.4)',
            boxSizing: 'border-box',
          }}>
          ₿ Buy Bitcoin Now
        </button>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '9px 14px' }}/>

      {/* ── Socials + email + legal ── */}
      <div style={{
        padding: '0 14px 12px',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        gap: '5px 8px',
        boxSizing: 'border-box',
      }}>
        <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Follow &amp; Connect
        </span>

        {SOCIALS.map(s => (
          <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
            title={s.label}
            style={{ fontSize: 16, textDecoration: 'none', lineHeight: 1 }}>
            {s.icon}
          </a>
        ))}

        <a href="https://chat.whatsapp.com/praqen" target="_blank" rel="noopener noreferrer"
          style={{
            fontSize: 10, fontWeight: 800, color: '#25D366', textDecoration: 'none',
            border: '1px solid rgba(37,211,102,0.3)', borderRadius: 6, padding: '2px 7px',
            whiteSpace: 'nowrap',
          }}>
          WhatsApp Community
        </a>

        <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: 10 }}>·</span>

        <a href="mailto:support@praqen.com"
          style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
          ✉️ support@praqen.com
        </a>

        <span style={{
          fontSize: 9, fontWeight: 800,
          background: 'rgba(64,145,108,0.22)', border: '1px solid rgba(64,145,108,0.38)',
          color: '#6EE7B7', padding: '2px 6px', borderRadius: 5, whiteSpace: 'nowrap',
        }}>24/7 Support</span>

        <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: 10 }}>·</span>

        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>© {new Date().getFullYear()} PRAQEN</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.16)', fontWeight: 600 }}>🔒 SSL Encrypted</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.16)', fontWeight: 600 }}>Escrow-Protected Trades</span>
      </div>

    </div>
  );
}
