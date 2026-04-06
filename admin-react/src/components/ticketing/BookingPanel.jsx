import GABookingForm from './GABookingForm';
import VipGABookingForm from './VipGABookingForm';
import TableBookingForm from './TableBookingForm';
import LadiesFreeForm from './LadiesFreeForm';

export default function BookingPanel({ type, date, availability, tableInfo, onBack }) {
  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        className="bg-bg-surface border border-border-default hover:border-brand/40 text-text-secondary hover:text-text-primary rounded-full px-4 py-2 text-sm transition-all duration-200 flex items-center gap-1.5 mb-5 cursor-pointer"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to Floor Plan
      </button>

      {/* Render correct form */}
      {type === 'ga' && (
        <GABookingForm date={date} availability={availability} />
      )}
      {type === 'vip_ga' && (
        <VipGABookingForm date={date} availability={availability} />
      )}
      {type === 'table' && tableInfo && (
        <TableBookingForm
          date={date}
          type={tableInfo.type}
          number={tableInfo.number}
          tier={tableInfo.tier}
          availability={availability}
        />
      )}
      {type === 'ladies_free' && (
        <LadiesFreeForm
          date={date}
          remaining={availability?.ladies_free_remaining}
        />
      )}
    </div>
  );
}
