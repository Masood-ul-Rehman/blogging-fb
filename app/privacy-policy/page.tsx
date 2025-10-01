import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Blogging Platform",
  description:
    "Privacy Policy for our blogging platform and Facebook integration",
};

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600 mb-4">
          <strong>Last updated:</strong> {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            1. Information We Collect
          </h2>
          <p className="mb-4">
            We collect information you provide directly to us, such as when you
            create an account, use our services, or contact us for support.
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Account information (name, email address)</li>
            <li>Content you create and share on our platform</li>
            <li>
              Facebook account information (when you connect your Facebook
              account)
            </li>
            <li>Usage data and analytics</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            2. How We Use Your Information
          </h2>
          <p className="mb-4">We use the information we collect to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices and support messages</li>
            <li>
              Connect with Facebook services for advertising and content
              management
            </li>
            <li>Respond to your comments and questions</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            3. Facebook Integration
          </h2>
          <p className="mb-4">
            When you connect your Facebook account, we may access and store
            certain information from your Facebook profile, including:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Basic profile information (name, email)</li>
            <li>Facebook Page information (if you manage pages)</li>
            <li>Advertising account data (for campaign management)</li>
            <li>Content you choose to share from our platform to Facebook</li>
          </ul>
          <p className="mb-4">
            This information is used solely to provide our services and is not
            shared with third parties except as described in this policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            4. Information Sharing
          </h2>
          <p className="mb-4">
            We do not sell, trade, or otherwise transfer your personal
            information to third parties without your consent, except:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>To comply with legal obligations</li>
            <li>To protect our rights and safety</li>
            <li>With service providers who assist in our operations</li>
            <li>With Facebook as part of the integration services</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
          <p className="mb-4">
            We implement appropriate security measures to protect your personal
            information against unauthorized access, alteration, disclosure, or
            destruction.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
          <p className="mb-4">You have the right to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Delete your account and data</li>
            <li>Disconnect your Facebook account</li>
            <li>Opt out of certain data processing</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this Privacy Policy, please contact
            us at:
          </p>
          <p className="mb-4">
            Email: privacy@yourdomain.com
            <br />
            Address: [Your Business Address]
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            8. Changes to This Policy
          </h2>
          <p className="mb-4">
            We may update this Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page
            and updating the "Last updated" date.
          </p>
        </section>
      </div>
    </div>
  );
}
