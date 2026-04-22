import React from 'react';

const PageLayout = ({ title, children }) => (
  <div className="min-h-screen text-black px-10 py-32 max-w-[80%] mx-auto">
    <h1 className="md:text-4xl text-2xl font-semibold mb-16 border-b-4 border-black pb-4 inline-block">{title}</h1>
    <div className="prose prose-lg max-w-none space-y-12">
      {children}
    </div>
  </div>
);

const ComingSoon = ({ title }) => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center bg-white px-10 border-t border-gray-100">
    <h1 className="text-6xl font-black uppercase tracking-tighter mb-4">{title}</h1>
    <p className="text-gray-400 font-bold uppercase tracking-[4px] text-xs">This experience is being curated. Check back soon.</p>
    <div className="mt-12 w-20 h-1 bg-black"></div>
  </div>
);

export const Shipping = () => (
  <PageLayout title="Shipping Policy">
    <section className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tight">Delivery Timelines</h2>
      <p className="text-gray-600 font-medium leading-relaxed">
        Our signature collections are curated with care. Once your order is confirmed, please allow 2-4 business days for processing.
        Standard shipping typically delivers within 5-7 business days across domestic locations.
      </p>
    </section>
    <section className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tight">Shipping Rates</h2>
      <p className="text-gray-600 font-medium leading-relaxed">
        We offer flat-rate shipping on all domestic orders. Orders above ₹2,999 qualify for complimentary premium shipping.
        International shipping rates are calculated at checkout based on destination and weight.
      </p>
    </section>
    <section className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tight">Tracking Your Order</h2>
      <p className="text-gray-600 font-medium leading-relaxed">
        Upon dispatch, a unique tracking identity will be shared via email and SMS. You can monitor your shipment's progress
        through our logistics partner's portal.
      </p>
    </section>
  </PageLayout>
);

export const Returns = () => (
  <PageLayout title="Returns & Exchanges">
    <section className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tight">Return Window</h2>
      <p className="text-gray-600 font-medium leading-relaxed">
        We maintain a 7-day return policy for all unworn, unwashed items in their original packaging with tags intact.
        Items must be in pristine condition to qualify for a refund or exchange.
      </p>
    </section>
    <section className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tight">The Process</h2>
      <p className="text-gray-600 font-medium leading-relaxed">
        To initiate a return, please visit our self-service portal or reach out to our concierge team. Once approved,
        a reverse pickup will be scheduled within 48 hours.
      </p>
    </section>
    <section className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tight">Exchanges</h2>
      <p className="text-gray-600 font-medium leading-relaxed">
        Size or color exchanges are subject to stock availability. If your desired replacement is out of stock,
        a store credit or full refund will be issued.
      </p>
    </section>
  </PageLayout>
);

export const Shop = () => <ComingSoon title="Shop" />;
export const CollectionsPage = () => <ComingSoon title="Collections" />;
export const NewArrivals = () => <ComingSoon title="New Arrivals" />;
export const About = () => <ComingSoon title="About Us" />;
export const Privacy = () => (
  <PageLayout title="Privacy Policy">
    <section className="space-y-4">
      <p className="text-gray-600 font-medium leading-relaxed">
        <span className="font-black text-black">GHAR OF ETHNICS</span> values your privacy and is committed to protecting your
        personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you
        visit our website or make a purchase.
      </p>
      {/* <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-xs">
        Effective Date: [Insert Date]
      </p> */}
    </section>

    <section className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tight">1. Information We Collect</h2>
      <div className="space-y-4">
        <p className="text-gray-700 font-black uppercase tracking-wide">a. Personal Information</p>
        <p className="text-gray-600 font-medium leading-relaxed">
          Full Name, Email Address, Phone Number, Shipping and Billing Address, and Payment Details
          processed securely via third-party gateways.
        </p>
      </div>
      <div className="space-y-4">
        <p className="text-gray-700 font-black uppercase tracking-wide">b. Non-Personal Information</p>
        <p className="text-gray-600 font-medium leading-relaxed">
          Browser type, device information, and website usage data.
        </p>
      </div>
    </section>

    <section className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tight">2. How We Use Your Information</h2>
      <p className="text-gray-600 font-medium leading-relaxed">
        We use your information for processing orders, customer support, improving user experience,
        marketing with your consent, and fraud prevention.
      </p>
    </section>

    <section className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tight">3. Sharing of Information</h2>
      <p className="text-gray-600 font-medium leading-relaxed">
        We do not sell or rent personal data. Information may be shared with delivery partners,
        payment gateways, and legal authorities if required.
      </p>
    </section>

    <section className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tight">4. Data Security</h2>
      <p className="text-gray-600 font-medium leading-relaxed">
        We implement secure systems and restricted access to protect your data, though no method is
        100% secure.
      </p>
    </section>

    <section className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tight">5. Cookies Policy</h2>
      <p className="text-gray-600 font-medium leading-relaxed">
        Cookies are used to enhance experience and analyze traffic. Users can disable cookies in
        browser settings.
      </p>
    </section>

    <section className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tight">6. Your Rights</h2>
      <p className="text-gray-600 font-medium leading-relaxed">
        You may access, update, or delete personal data, and opt out of marketing at any time by
        contacting us.
      </p>
    </section>

    <section className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tight">7. Third-Party Links</h2>
      <p className="text-gray-600 font-medium leading-relaxed">
        We are not responsible for the privacy practices of external websites linked from our platform.
      </p>
    </section>

    <section className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tight">8. Changes to This Policy</h2>
      <p className="text-gray-600 font-medium leading-relaxed">
        This policy may be updated at any time with a revised effective date.
      </p>
    </section>

    <section className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tight">9. Contact Us</h2>
      <p className="text-gray-600 font-medium leading-relaxed">
        GHAR OF ETHNICS
      </p>
      <p className="text-gray-600 font-medium leading-relaxed">
        Email: <a href="mailto:support@gharofethnics.com">support@gharofethnics.com</a>
      </p>
      <p className="text-gray-600 font-medium leading-relaxed">Phone: <a href="tel:+919845634734">+91 98456 34734</a></p>
      <p className="text-gray-600 font-medium leading-relaxed">
        Address: Ghar of Ethnics, 38, Booth no-127, 2nd Main Road, Ashwini Layout, Ejipura,
        Koramangala, Bangalore-560047
      </p>
    </section>
  </PageLayout>
);
export const Terms = () => (
  <PageLayout title="Terms & Conditions">
    <section className="space-y-4">
      <p className="text-gray-600 font-medium leading-relaxed">
        These Terms and Conditions govern the use of the GHAR OF ETHNICS website and services.
        By using our website, you agree to these terms.
      </p>
    </section>

    <section className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tight">1. General</h2>
      <p className="text-gray-600 font-medium leading-relaxed">
        This website is operated by GHAR OF ETHNICS. By using our services, you agree to these Terms.
      </p>
    </section>

    <section className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tight">2. Products</h2>
      <p className="text-gray-600 font-medium leading-relaxed">
        All products are handcrafted. Minor variations in color or design are natural and are not defects.
      </p>
    </section>

    <section className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tight">3. Pricing</h2>
      <p className="text-gray-600 font-medium leading-relaxed">
        Prices are listed in INR and are subject to change without notice.
      </p>
    </section>

    <section className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tight">4. Orders</h2>
      <p className="text-gray-600 font-medium leading-relaxed">
        We reserve the right to cancel orders due to errors, pricing issues, or product unavailability.
      </p>
    </section>

    <section className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tight">5. Shipping</h2>
      <p className="text-gray-600 font-medium leading-relaxed">
        Delivery timelines may vary depending on location and external factors beyond our control.
      </p>
    </section>

    <section className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tight">6. Returns</h2>
      <p className="text-gray-600 font-medium leading-relaxed">
        Returns are accepted only for damaged or incorrect items, and requests must be raised within
        48 hours of delivery.
      </p>
    </section>

    <section className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tight">7. Intellectual Property</h2>
      <p className="text-gray-600 font-medium leading-relaxed">
        All website content belongs to GHAR OF ETHNICS and may not be reused without prior permission.
      </p>
    </section>

    <section className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tight">8. Liability</h2>
      <p className="text-gray-600 font-medium leading-relaxed">
        We are not liable for indirect damages. Our liability is limited to the value of the product purchased.
      </p>
    </section>

    <section className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tight">9. Governing Law</h2>
      <p className="text-gray-600 font-medium leading-relaxed">
        These terms are governed by the laws of India.
      </p>
    </section>
  </PageLayout>
);

export default { Shipping, Returns, Shop, CollectionsPage, NewArrivals, About, Privacy, Terms };
