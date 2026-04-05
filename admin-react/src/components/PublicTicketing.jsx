import { useState } from 'react';
import TicketingSection from './ticketing/TicketingSection';

export default function PublicTicketing() {
  return (
    <div className="min-h-screen bg-bg-deep">
      <div className="max-w-[960px] mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl tracking-[6px] text-brand">
            LA CASITA
          </h1>
          <p className="text-text-secondary mt-2 text-sm">Select a date to get tickets</p>
        </div>
        <TicketingSection />
      </div>
    </div>
  );
}
