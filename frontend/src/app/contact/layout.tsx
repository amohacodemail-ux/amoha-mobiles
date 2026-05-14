import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Amohamobiles – Mobile Shop in Idikarai, Coimbatore',
  description: 'Contact Amohamobiles in Idikarai, Coimbatore. Call, visit or message us for product enquiries, repairs & support. Mon–Sat 10AM–8PM.',
  keywords: ['contact amohamobiles coimbatore', 'mobile shop phone number coimbatore', 'amohamobiles address idikarai', 'mobile store contact coimbatore'],
  openGraph: {
    title: 'Contact Amohamobiles – Mobile Shop in Idikarai, Coimbatore',
    description: 'Contact Amohamobiles in Idikarai, Coimbatore for product enquiries, repairs & support. Mon–Sat 10AM–8PM.',
  },
  alternates: { canonical: 'https://amohamobiles.com/contact' },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
