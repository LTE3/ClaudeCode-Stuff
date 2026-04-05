export default function MerchCard({ name, description, price, stripeLink }) {
  return (
    <div className="bg-bg-surface border border-border-default rounded-[16px] p-5 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-border-hover group">
      <div className="text-text-primary font-bold text-sm mb-1">{name}</div>
      <div className="text-text-muted text-xs mb-3">{description}</div>
      <div className="text-brand font-bold text-lg mb-4">${price}</div>
      <a
        href={stripeLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block border-2 border-brand text-brand rounded-[30px] px-5 py-2 text-xs font-semibold hover:bg-brand hover:text-white transition-all duration-300"
      >
        Buy Now
      </a>
    </div>
  );
}
