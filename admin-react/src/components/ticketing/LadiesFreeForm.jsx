import { useState } from 'react';
import { useClaimFreeTicket } from '../../hooks/useClaimFreeTicket';

export default function LadiesFreeForm({ date, remaining }) {
  const { claim, loading, success } = useClaimFreeTicket();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const err = await claim({
      event_date: date,
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
    });
    if (err) setError(err);
  }

  if (success) {
    return (
      <div className="text-center py-10">
        <div className="text-5xl mb-4">&#127881;</div>
        <h3 className="font-[family-name:var(--font-display)] text-accent-teal text-2xl tracking-[3px] mb-2">
          YOU'RE ON THE LIST!
        </h3>
        <p className="text-text-secondary text-sm">
          Check your email for confirmation. See you there!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="font-[family-name:var(--font-display)] text-accent-teal text-2xl tracking-[3px] mb-1">
        LADIES FREE ENTRY
      </h3>
      <p className="text-text-secondary text-sm mb-4">
        Complimentary entry for ladies before midnight. Must be on the guest list.
      </p>

      <div className="bg-bg-surface border border-accent-teal/15 rounded-lg p-4 mb-5">
        <div className="flex justify-between items-center">
          <span className="text-text-secondary text-sm">Spots Remaining</span>
          <span className="text-accent-teal font-bold text-lg">{remaining ?? 0}</span>
        </div>
      </div>

      <input
        type="text" placeholder="Full Name" required value={name}
        onChange={e => setName(e.target.value)}
        className="w-full p-3.5 bg-bg-surface border border-border-default rounded-[8px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand-glow transition-all duration-200 mb-2.5"
      />
      <input
        type="email" placeholder="Email" required value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full p-3.5 bg-bg-surface border border-border-default rounded-[8px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand-glow transition-all duration-200 mb-2.5"
      />
      <input
        type="tel" placeholder="Phone" required value={phone}
        onChange={e => setPhone(e.target.value)}
        className="w-full p-3.5 bg-bg-surface border border-border-default rounded-[8px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand-glow transition-all duration-200 mb-2.5"
      />

      {error && <p className="text-accent-coral text-sm mb-3">{error}</p>}

      <button
        type="submit"
        disabled={loading || remaining === 0}
        className="w-full py-4 rounded-full font-[family-name:var(--font-display)] text-lg tracking-[3px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer border-none bg-accent-teal text-black disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        {loading ? 'CLAIMING...' : 'CLAIM FREE ENTRY'}
      </button>
    </form>
  );
}
