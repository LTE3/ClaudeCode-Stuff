import { useState } from 'react';
import { useClaimFreeTicket } from '../../hooks/useClaimFreeTicket';

export default function LadiesFreeForm({ date, remaining, claimType = 'ladies_free', title, subtitle }) {
  const { claim, loading, success, ticketData } = useClaimFreeTicket();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const err = await claim({
      event_date: date,
      claim_type: claimType,
      customer_name: name,
      customer_phone: phone,
      quantity,
    });
    if (err) setError(err);
  }

  if (success) {
    const qrData = ticketData?.booking_id
      ? `https://lacasitabk.com/admin/?verify=free_${ticketData.booking_id}`
      : '';
    const qrUrl = qrData
      ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}&bgcolor=0a0a0a&color=ffffff`
      : '';

    return (
      <div className="text-center py-6">
        <div className="text-5xl mb-3">🎉</div>
        <h3 className="font-[family-name:var(--font-display)] text-accent-teal text-2xl tracking-[3px] mb-2">
          YOU'RE IN!
        </h3>
        <div className="bg-accent-gold/10 border border-accent-gold/20 rounded-lg p-3 mb-4 mx-auto max-w-xs">
          <p className="text-accent-gold text-sm font-medium">📱 Screenshot this ticket!</p>
          <p className="text-text-muted text-xs mt-1">You'll need it at the door</p>
        </div>
        {qrUrl && (
          <div className="inline-block bg-black rounded-[16px] p-4 mb-3 border border-border-default">
            <img src={qrUrl} alt="Ticket QR Code" className="w-[180px] h-[180px]" />
          </div>
        )}
        <p className="text-text-muted text-xs mb-3">Show this QR code at the door</p>
        <div className="text-left max-w-xs mx-auto space-y-2">
          <div className="flex justify-between py-1 border-b border-border-default">
            <span className="text-text-muted text-sm">Name</span>
            <span className="text-text-primary text-sm font-medium">{ticketData?.customer_name}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border-default">
            <span className="text-text-muted text-sm">Ticket</span>
            <span className="text-accent-teal text-sm font-medium">{ticketData?.ticket_type === 'ladies_free' ? 'Ladies Free Entry' : 'Free GA'}{quantity > 1 ? ` x${quantity}` : ''}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border-default">
            <span className="text-text-muted text-sm">Date</span>
            <span className="text-text-primary text-sm font-medium">{ticketData?.event_date}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-text-muted text-sm">Venue</span>
            <span className="text-text-primary text-sm font-medium">428 Johnson Ave, BK 11237</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="font-[family-name:var(--font-display)] text-accent-teal text-2xl tracking-[3px] mb-1">
        {title || 'LADIES FREE ENTRY'}
      </h3>
      <p className="text-text-secondary text-sm mb-4">
        {subtitle || 'Complimentary entry for ladies before midnight. Must be on the guest list.'}
      </p>


      <input
        type="text" placeholder="First Name" required value={name}
        onChange={e => setName(e.target.value)}
        autoComplete="given-name" autoCapitalize="words"
        className="w-full p-3.5 bg-bg-surface border border-border-default rounded-[8px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand-glow transition-all duration-200 mb-2.5"
      />
      <input
        type="tel" placeholder="Phone" required value={phone}
        onChange={e => setPhone(e.target.value)}
        autoComplete="tel" inputMode="tel"
        className="w-full p-3.5 bg-bg-surface border border-border-default rounded-[8px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand-glow transition-all duration-200 mb-2.5"
      />

      <div className="flex items-center justify-between bg-bg-surface border border-border-default rounded-[8px] p-3 mb-2.5">
        <span className="text-text-secondary text-sm">Quantity</span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="w-8 h-8 rounded-full bg-bg-elevated border border-border-default text-text-primary flex items-center justify-center cursor-pointer hover:border-accent-teal/40 transition-colors text-lg font-bold">
            −
          </button>
          <span className="text-text-primary text-lg font-bold w-6 text-center">{quantity}</span>
          <button type="button" onClick={() => setQuantity(q => q + 1)}
            className="w-8 h-8 rounded-full bg-bg-elevated border border-border-default text-text-primary flex items-center justify-center cursor-pointer hover:border-accent-teal/40 transition-colors text-lg font-bold">
            +
          </button>
        </div>
      </div>

      {error && <p className="text-accent-coral text-sm mb-3">{error}</p>}

      <button
        type="submit"
        disabled={loading || remaining === 0}
        className="w-full py-4 rounded-full font-[family-name:var(--font-display)] text-lg tracking-[3px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer border-none bg-accent-teal text-black disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        {loading ? 'CLAIMING...' : quantity > 1 ? `CLAIM ${quantity} FREE TICKETS` : 'CLAIM FREE ENTRY'}
      </button>
    </form>
  );
}
