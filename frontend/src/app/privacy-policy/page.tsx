import { Metadata } from 'next';
import PrivacyPolicyClient from './PrivacyPolicyClient';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'AMOHA Mobiles privacy policy – how we collect, use, and protect your personal data when you shop with us.',
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />;
}
