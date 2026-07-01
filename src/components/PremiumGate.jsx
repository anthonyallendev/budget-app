import { Link } from 'react-router-dom'

export default function PremiumGate({ feature = 'this feature', description, children }) {
  return (
    <div className="glass rounded-2xl overflow-hidden relative"
      style={{ borderColor: 'rgba(124,58,237,0.25)' }}>
      {/* Blurred preview */}
      <div style={{ filter: 'blur(3px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.4 }}>
        {children}
      </div>
      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
        style={{ background: 'rgba(6,11,26,0.75)', backdropFilter: 'blur(2px)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.2))', border: '1px solid rgba(124,58,237,0.3)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-white font-semibold text-lg mb-1">Premium feature</p>
        <p className="text-slate-400 text-sm mb-5 max-w-xs leading-relaxed">
          {description || `Upgrade to unlock ${feature}.`}
        </p>
        <Link to="/upgrade"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.5L10 14.5l-4.9 2.7.9-5.5L2 7.8l5.5-.8z" />
          </svg>
          Upgrade to Premium
        </Link>
      </div>
    </div>
  )
}
