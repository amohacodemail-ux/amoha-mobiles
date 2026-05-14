import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mobile Repair Services in Coimbatore – Amohamobiles Idikarai',
  description: 'Professional mobile repair in Coimbatore at Amohamobiles, Idikarai. Screen, battery, charging port & more. Fast turnaround, genuine parts & warranty.',
  keywords: [
    'mobile repair coimbatore', 'phone repair coimbatore', 'phone repair idikarai',
    'screen replacement coimbatore', 'battery replacement mobile coimbatore',
    'charging port repair coimbatore', 'back glass repair coimbatore',
    'water damage repair coimbatore', 'motherboard repair coimbatore',
    'mobile service centre coimbatore', 'mobile service centre idikarai',
    'phone repair shop coimbatore', 'mobile repair near me coimbatore',
    'iphone repair coimbatore', 'samsung repair coimbatore', 'oneplus repair coimbatore',
    'mobile repair shop gandhipuram', 'phone repair saravanampatti',
    'best mobile repair shop coimbatore', 'genuine parts mobile repair coimbatore',
    'affordable mobile repair coimbatore', 'fast mobile repair coimbatore',
  ],
  openGraph: {
    title: 'Mobile Repair Services in Coimbatore – Amohamobiles Idikarai',
    description: 'Professional mobile repair in Coimbatore at Amohamobiles – screen, battery, charging port & more. Genuine parts, warranty included.',
  },
  alternates: { canonical: 'https://amohamobiles.com/services' },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Where is the best mobile repair shop in Coimbatore?',
      acceptedAnswer: { '@type': 'Answer', text: 'Amohamobiles at Therveethi, Idikarai, Coimbatore is one of the best mobile repair shops in Coimbatore. We offer screen replacement, battery change, charging port repair, water damage repair and more with genuine parts and warranty.' },
    },
    {
      '@type': 'Question',
      name: 'How much does mobile screen replacement cost in Coimbatore?',
      acceptedAnswer: { '@type': 'Answer', text: 'Screen replacement at Amohamobiles, Coimbatore starts from ₹799 depending on the device model. We use genuine or high-quality OEM parts for Samsung, iPhone, OnePlus, Xiaomi, Realme and all major brands.' },
    },
    {
      '@type': 'Question',
      name: 'Do you repair iPhones in Coimbatore?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes, Amohamobiles provides professional iPhone repair services in Coimbatore. We repair all iPhone models – screen, battery, charging port, back glass and more at competitive prices with warranty.' },
    },
    {
      '@type': 'Question',
      name: 'How long does mobile repair take at your Coimbatore shop?',
      acceptedAnswer: { '@type': 'Answer', text: 'Most repairs at our Idikarai, Coimbatore store are completed within 30 minutes to 2 hours. Complex repairs like motherboard or water damage may take 1–2 days. Walk in Monday to Saturday, 10AM–8PM.' },
    },
    {
      '@type': 'Question',
      name: 'Do you offer home pickup for mobile repair in Coimbatore?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes, Amohamobiles offers doorstep mobile repair service and pickup across Coimbatore – Idikarai, Gandhipuram, RS Puram, Saravanampatti, Peelamedu and nearby areas. Contact us on WhatsApp at +91 63801 23183.' },
    },
  ],
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  );
}
