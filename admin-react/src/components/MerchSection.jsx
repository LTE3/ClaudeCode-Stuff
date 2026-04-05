import MerchCard from './MerchCard';

const products = [
  {
    name: 'DTMF SONG KEYCHAINS',
    description: 'Custom melody keychains',
    price: 12,
    stripeLink: 'https://buy.stripe.com/cNieVfajCcZjbkJaZf0Jq04'
  },
  {
    name: 'DTMF ACRYLIC KEYCHAINS',
    description: 'Clear acrylic design',
    price: 12,
    stripeLink: 'https://buy.stripe.com/00w7sN3Ve1gB88xebr0Jq05'
  },
  {
    name: 'SAPO CONCHO PLUSHIES',
    description: 'Collectible plush toys',
    price: 15,
    stripeLink: 'https://buy.stripe.com/cNifZj0J2gbvagFc3j0Jq06'
  },
  {
    name: 'SAPO CONCHO TOTE BAG',
    description: 'Canvas tote bag',
    price: 20,
    stripeLink: 'https://buy.stripe.com/dRmdRb63mf7r1K9ffv0Jq07'
  },
  {
    name: 'DTMF T-SHIRTS',
    description: 'Premium cotton tee',
    price: 20,
    stripeLink: 'https://buy.stripe.com/7sY3cx0J27EZ2Od8R70Jq08'
  }
];

export default function MerchSection() {
  return (
    <div className="bg-bg-elevated border border-border-default rounded-[16px] overflow-hidden mb-6">
      <div className="p-5 border-b border-border-default">
        <h2 className="font-[family-name:var(--font-display)] text-text-primary text-xl tracking-[3px]">
          MERCH
        </h2>
        <p className="text-text-muted text-xs mt-1">Official La Casita merchandise</p>
      </div>

      <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {products.map((product) => (
          <MerchCard key={product.name} {...product} />
        ))}
      </div>
    </div>
  );
}
