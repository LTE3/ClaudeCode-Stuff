import { useState } from 'react';
import { supabaseEdge } from '../config/supabase';

const tiers = [
  {
    name: 'GA',
    price: '$35',
    color: 'blue',
    perks: ['General admission entry', 'Access to main floor', 'Standard bar service'],
    tierKey: 'ga'
  },
  {
    name: 'VIP',
    price: '$75',
    color: 'gold',
    perks: ['Priority entry — skip the line', 'VIP lounge access', 'Complimentary welcome drink'],
    tierKey: 'vip'
  },
  {
    name: 'Tables',
    price: '$250',
    color: 'coral',
    perks: ['Reserved table for the night', 'Bottle service included', 'Dedicated server'],
    tierKey: 'table'
  }
];

const colorStyles = {
  blue: {
    label: 'text-accent-blue',
    border: 'border-accent-blue text-accent-blue hover:bg-accent-blue hover:text-black',
    glow: 'from-blue-glow'
  },
  gold: {
    label: 'text-accent-gold',
    border: 'border-accent-gold text-accent-gold hover:bg-accent-gold hover:text-black',
    glow: 'from-gold-glow'
  },
  coral: {
    label: 'text-accent-coral',
    border: 'border-accent-coral text-accent-coral hover:bg-accent-coral hover:text-black',
    glow: 'from-coral-glow'
  }
};

export default function TicketCheckoutCards() {
  const [loadingTier, setLoadingTier] = useState(null);

  const handleCheckout = async (tierKey) => {
    setLoadingTier(tierKey);
    try {
      const data = await supabaseEdge('create-checkout', { tier: tierKey });
      if (data.url) {
        (window.top || window).location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="bg-bg-elevated border border-border-default rounded-[16px] overflow-hidden mb-6">
      <div className="p-5 border-b border-border-default">
        <h2 className="font-[family-name:var(--font-display)] text-text-primary text-xl tracking-[3px]">
          TICKET CHECKOUT
        </h2>
        <p className="text-text-muted text-xs mt-1">live Stripe — real payments</p>
      </div>

      <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {tiers.map((tier) => {
          const cs = colorStyles[tier.color];
          return (
            <div
              key={tier.tierKey}
              className="group relative bg-bg-surface border border-border-default rounded-[16px] p-5 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-border-hover overflow-hidden"
            >
              <div className={`text-[0.7rem] uppercase tracking-[2px] font-semibold ${cs.label} mb-2`}>
                {tier.name}
              </div>
              <div className="text-text-primary text-3xl font-bold mb-4">{tier.price}</div>
              <ul className="text-text-secondary text-xs space-y-2 mb-5">
                {tier.perks.map((perk, i) => (
                  <li key={i}>{perk}</li>
                ))}
              </ul>
              <button
                onClick={() => handleCheckout(tier.tierKey)}
                disabled={loadingTier === tier.tierKey}
                className={`w-full border-2 ${cs.border} rounded-[30px] px-4 py-2.5 text-sm font-semibold transition-all duration-300 disabled:opacity-50 cursor-pointer`}
              >
                {loadingTier === tier.tierKey ? 'Processing...' : `Buy ${tier.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
