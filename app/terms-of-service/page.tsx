import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Blogging Platform",
  description:
    "Terms of Service for our blogging platform and Facebook integration",
};

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600 mb-4">
          <strong>Last updated:</strong> {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            1. Acceptance of Terms
          </h2>
          <p className="mb-4">
            By accessing and using our blogging platform, you accept and agree
            to be bound by the terms and provision of this agreement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
          <p className="mb-4">
            Permission is granted to temporarily use our platform for personal,
            non-commercial transitory viewing only. This is the grant of a
            license, not a transfer of title, and under this license you may
            not:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Modify or copy the materials</li>
            <li>
              Use the materials for any commercial purpose or for any public
              display
            </li>
            <li>
              Attempt to reverse engineer any software contained on the platform
            </li>
            <li>
              Remove any copyright or other proprietary notations from the
              materials
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            3. Facebook Integration
          </h2>
          <p className="mb-4">
            Our platform integrates with Facebook services. By connecting your
            Facebook account, you agree to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>
              Comply with Facebook's Terms of Service and Community Standards
            </li>
            <li>
              Allow us to access your Facebook data as necessary for our
              services
            </li>
            <li>
              Understand that Facebook data usage is subject to Facebook's
              privacy policies
            </li>
            <li>
              Be responsible for any content you share through our platform to
              Facebook
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. User Content</h2>
          <p className="mb-4">
            You are responsible for all content you create, upload, or share on
            our platform. You agree not to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Post illegal, harmful, or offensive content</li>
            <li>Infringe on intellectual property rights</li>
            <li>Spam or engage in fraudulent activities</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            5. Service Availability
          </h2>
          <p className="mb-4">
            We strive to maintain high service availability but do not guarantee
            uninterrupted access. We reserve the right to modify or discontinue
            the service at any time.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            6. Limitation of Liability
          </h2>
          <p className="mb-4">
            In no event shall our company or its suppliers be liable for any
            damages arising out of the use or inability to use our platform,
            even if we have been notified of the possibility of such damage.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Termination</h2>
          <p className="mb-4">
            We may terminate or suspend your account and access to our service
            immediately, without prior notice, for any reason whatsoever,
            including without limitation if you breach the Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            8. Contact Information
          </h2>
          <p className="mb-4">
            If you have any questions about these Terms of Service, please
            contact us at:
          </p>
          <p className="mb-4">
            Email: legal@yourdomain.com
            <br />
            Address: [Your Business Address]
          </p>
        </section>
      </div>
    </div>
  );
}
