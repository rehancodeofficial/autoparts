import React from 'react';

interface LegalPageProps {
  page: 'terms' | 'privacy' | 'cookies';
}

export const LegalPage: React.FC<LegalPageProps> = ({ page }) => {
  const content = {
    terms: {
      title: 'Terms & Conditions',
      updated: 'Last updated: October 2024',
      sections: [
        {
          heading: '1. Acceptance of Terms',
          body: 'By accessing or purchasing from Autoparts KSA ("we", "our", "the Company"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our website or services.'
        },
        {
          heading: '2. Products & Availability',
          body: 'All products listed on our website are subject to availability. We reserve the right to discontinue any product at any time. Product images are for illustration purposes only. Actual product may vary slightly from the image shown.'
        },
        {
          heading: '3. Pricing & Payment',
          body: 'All prices are listed in Saudi Riyals (SAR) and are inclusive of VAT (15%) as required by ZATCA regulations. We accept payment via VISA, Mastercard, Apple Pay, STC Pay, and Tamara installments. Prices are subject to change without prior notice.'
        },
        {
          heading: '4. Order Placement & Confirmation',
          body: 'An order placed on our website constitutes an offer to purchase the products listed. We reserve the right to decline or cancel any order for any reason. Order confirmation will be sent to the email address provided at checkout.'
        },
        {
          heading: '5. Shipping & Delivery',
          body: 'We offer delivery across the Kingdom of Saudi Arabia. Standard delivery takes 1–3 business days for major cities (Riyadh, Jeddah, Dammam). Remote areas may take up to 5 business days. Free shipping is available on orders above 300 SAR. We are not responsible for delays caused by third-party courier services or force majeure events.'
        },
        {
          heading: '6. Returns & Exchanges',
          body: 'Returns are accepted within 7 days of delivery for unused, unopened parts in original packaging. Electrical components, consumables, and special-order parts are non-returnable. To initiate a return, contact our support team with your order number and reason for return.'
        },
        {
          heading: '7. Warranty',
          body: 'All genuine OEM parts carry the original manufacturer\'s warranty. Performance aftermarket parts carry warranty as specified by the respective brand. Warranty does not cover damage caused by incorrect installation, misuse, or neglect.'
        },
        {
          heading: '8. Intellectual Property',
          body: 'All content on this website including text, graphics, logos, and images are the property of Autoparts KSA or its content suppliers and are protected by applicable intellectual property laws.'
        },
        {
          heading: '9. Limitation of Liability',
          body: 'Autoparts KSA shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services beyond the purchase price of the item in question.'
        },
        {
          heading: '10. Governing Law',
          body: 'These Terms and Conditions shall be governed by the laws of the Kingdom of Saudi Arabia. Any disputes shall be subject to the jurisdiction of the Saudi courts.'
        },
      ]
    },
    privacy: {
      title: 'Privacy Policy',
      updated: 'Last updated: October 2024',
      sections: [
        {
          heading: '1. Introduction',
          body: 'Autoparts KSA ("we", "our") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our website and services.'
        },
        {
          heading: '2. Information We Collect',
          body: 'We collect the following types of information: (a) Personal Information: name, email address, phone number, delivery address; (b) Payment Information: processed securely through payment gateways — we do not store card details; (c) Usage Data: browser type, pages visited, time spent, and other analytics data; (d) Vehicle Information: make, model, and year if provided for part compatibility.'
        },
        {
          heading: '3. How We Use Your Information',
          body: 'We use your information to: process and fulfil your orders; send order confirmations and delivery updates; provide customer support; send promotional offers (with your consent); improve our website and product range; comply with legal and regulatory obligations including ZATCA e-invoicing requirements.'
        },
        {
          heading: '4. Data Sharing',
          body: 'We do not sell your personal data to third parties. We share data only with: courier partners for delivery purposes; payment processors for transaction handling; analytics providers (Google Analytics) to improve our services; government authorities when required by Saudi law.'
        },
        {
          heading: '5. Data Security',
          body: 'We implement industry-standard security measures including SSL encryption, firewalls, and access controls to protect your personal information. However, no method of internet transmission is 100% secure.'
        },
        {
          heading: '6. Cookies',
          body: 'We use cookies and similar tracking technologies to enhance your browsing experience. For details, please refer to our Cookie Policy. You can manage cookie preferences through your browser settings.'
        },
        {
          heading: '7. Your Rights',
          body: 'You have the right to: access, correct, or delete your personal data; withdraw consent for marketing communications; request data portability. To exercise these rights, contact us at privacy@autoparts.sa.'
        },
        {
          heading: '8. Data Retention',
          body: 'We retain your personal data for as long as necessary to fulfil the purposes outlined in this policy, or as required by Saudi law. Order records are retained for 5 years for tax and accounting purposes.'
        },
        {
          heading: '9. Changes to This Policy',
          body: 'We may update this Privacy Policy periodically. Changes will be posted on this page with an updated revision date. Continued use of our website constitutes acceptance of the updated policy.'
        },
        {
          heading: '10. Contact',
          body: 'For privacy-related queries, contact us at: privacy@autoparts.sa or call 800 124 9900.'
        },
      ]
    },
    cookies: {
      title: 'Cookie Policy',
      updated: 'Last updated: October 2024',
      sections: [
        {
          heading: '1. What Are Cookies?',
          body: 'Cookies are small text files stored on your device when you visit a website. They are widely used to make websites work more efficiently and to provide analytical information to website owners.'
        },
        {
          heading: '2. Types of Cookies We Use',
          body: 'Essential Cookies: Required for the website to function. These include session cookies for cart management and login state. They cannot be disabled.\n\nAnalytics Cookies: We use Google Analytics to understand how visitors interact with our website. Data collected is anonymised and used to improve our services.\n\nPreference Cookies: These remember your choices such as language settings and recently viewed products.\n\nMarketing Cookies: Used to deliver relevant advertisements. You can opt out of these via your browser settings.'
        },
        {
          heading: '3. Third-Party Cookies',
          body: 'Some cookies on our website are placed by third parties, including Google Analytics, payment processors (Checkout.com, Apple Pay, STC Pay), and social media platforms. These are governed by the respective third-party privacy policies.'
        },
        {
          heading: '4. Managing Cookies',
          body: 'You can control or delete cookies through your browser settings. Note that disabling essential cookies may affect website functionality, including your ability to add items to cart or complete purchases.'
        },
        {
          heading: '5. Consent',
          body: 'By continuing to use our website, you consent to the use of cookies as described in this policy. You may withdraw consent at any time by clearing cookies from your browser and updating your preferences.'
        },
        {
          heading: '6. Cookie Lifespan',
          body: 'Session cookies are deleted when you close your browser. Persistent cookies remain on your device until they expire or you delete them. Most persistent cookies on our site expire within 12 months.'
        },
        {
          heading: '7. Contact',
          body: 'For questions about our use of cookies, contact us at: support@autoparts.sa'
        },
      ]
    }
  };

  const { title, updated, sections } = content[page];

  return (
    <main style={{ flex: 1, backgroundColor: '#F5F5F5', padding: '0 0 60px 0' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #111111 0%, #1E1E1E 100%)',
        padding: '56px 24px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '3px', color: '#E53935', textTransform: 'uppercase', marginBottom: '12px' }}>
          LEGAL
        </div>
        <h1 style={{ fontSize: '38px', fontWeight: 900, color: '#ffffff', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </h1>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>{updated}</div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '40px 48px', border: '1px solid #E8E8E8', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          {sections.map((sec, i) => (
            <div key={i} style={{ marginBottom: i < sections.length - 1 ? '32px' : 0 }}>
              <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#1A1A1A', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                {sec.heading}
              </h2>
              <p style={{ fontSize: '14px', color: '#555555', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>
                {sec.body}
              </p>
              {i < sections.length - 1 && (
                <div style={{ borderBottom: '1px solid #F0F0F0', marginTop: '28px' }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};
