import { Metadata } from 'next';
import TermsOfServiceClient from './TermsOfServiceClient';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'AMOHA Mobiles terms of service – rules, guidelines, and conditions for using our online store.',
};

export default function TermsOfServicePage() {
  return <TermsOfServiceClient />;
}
