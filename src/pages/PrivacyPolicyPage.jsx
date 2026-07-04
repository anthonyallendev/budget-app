import { useState } from 'react'
import { Link } from 'react-router-dom'

const LAST_UPDATED = '1 July 2026'
const CONTACT_EMAIL = 'privacy@retirely.money'
const COMPANY = 'Retirely'
const DOMAIN = 'retirely.money'

function Section({ id, title, children }) {
  return (
    <section id={id} className="mb-12">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
        <span className="w-1 h-6 rounded-full shrink-0" style={{ background: 'linear-gradient(180deg,#00d4ff,#7c3aed)' }} />
        {title}
      </h2>
      <div className="flex flex-col gap-3 text-slate-400 text-sm leading-relaxed pl-4">
        {children}
      </div>
    </section>
  )
}

function Sub({ title, children }) {
  return (
    <div className="mt-4">
      <h3 className="text-white font-semibold text-sm mb-2">{title}</h3>
      <div className="flex flex-col gap-2 text-slate-400 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  )
}

function Ul({ items }) {
  return (
    <ul className="flex flex-col gap-1.5 mt-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="text-cyan-600 mt-1 shrink-0">›</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function TableRow({ service, purpose, link }) {
  return (
    <tr className="border-b border-white/5">
      <td className="py-3 pr-4 text-white font-medium text-sm whitespace-nowrap">{service}</td>
      <td className="py-3 pr-4 text-slate-400 text-sm">{purpose}</td>
      <td className="py-3 text-cyan-600 text-xs">{link}</td>
    </tr>
  )
}

// ── Privacy Policy content ────────────────────────────────────────────────────

function PrivacyContent() {
  return (
    <>
      <Section id="pp-intro" title="1. Introduction">
        <p>
          {COMPANY} ("we", "us", "our") operates the personal finance platform available at {DOMAIN} (the "Service").
          This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our Service.
        </p>
        <p>
          We are committed to protecting your privacy. <strong className="text-white">We do not sell, rent, or trade your personal data to any third party for any purpose, including marketing.</strong> Your financial information is used solely to provide you with the Service.
        </p>
        <p>
          By creating an account or using the Service, you agree to this Privacy Policy. If you do not agree, please do not use the Service.
        </p>
        <p className="text-slate-500 text-xs">Last updated: {LAST_UPDATED}</p>
      </Section>

      <Section id="pp-collect" title="2. Information We Collect">
        <Sub title="2.1 Account Information">
          <p>When you register, we collect:</p>
          <Ul items={[
            'Full name and email address',
            'Date of birth (used to calculate retirement projections)',
            'Country of residence (used to apply correct superannuation and tax rules)',
            'Password (stored as a cryptographic hash — we never store plain-text passwords)',
            'Google account information if you sign in with Google (name, email, profile photo)',
            'A username you choose for the anonymous leaderboard',
          ]} />
        </Sub>

        <Sub title="2.2 Financial Profile Data">
          <p>To power your retirement and savings projections, we collect:</p>
          <Ul items={[
            'Current personal savings balance and monthly contribution amount',
            'Desired retirement income and superannuation balance',
            'Selected investment return rate (conservative / moderate / aggressive)',
            'Interest rate information you enter into the Interest Rate widget',
          ]} />
          <p>This data is stored securely in our database and used exclusively to calculate your personalised financial projections.</p>
        </Sub>

        <Sub title="2.3 Transaction Data">
          <p>If you manually enter transactions or connect a bank account (Premium), we collect:</p>
          <Ul items={[
            'Transaction date, amount, type (income / expense / savings), category, and description',
            'For bank-synced transactions: merchant name, transaction ID, currency, and pending status',
            'Recurring transaction patterns derived from your transaction history',
          ]} />
        </Sub>

        <Sub title="2.4 Financial Goals and Tracking Data">
          <Ul items={[
            'Savings goals (name, icon, target amount, saved amount, target date)',
            'Net worth entries (assets and liabilities you enter manually)',
            'Daily net worth snapshots',
            'Debt payoff records (debt name, balance, interest rate, minimum payment)',
            'Recurring bills (name, amount, due date, category, frequency)',
            'Tax estimate inputs (salary, country)',
          ]} />
        </Sub>

        <Sub title="2.5 Engagement and Behavioural Data (Local Only)">
          <p>The following data is stored <strong className="text-white">only on your device</strong> in your browser's localStorage and is never transmitted to our servers:</p>
          <Ul items={[
            'Daily check-in streak count and history',
            'Weekly financial health score history',
            'Weekly check-in responses (how you rate your budget, savings, and financial wellbeing)',
            'Dismissed milestone notifications',
            'Interest rate widget preferences',
            'Statement download history',
            'Leaderboard score publish timestamp',
          ]} />
          <p>This data is cleared if you clear your browser data and is not accessible to us.</p>
        </Sub>

        <Sub title="2.6 Bank Connection Data (Premium — Plaid and Basiq)">
          <p>If you connect your bank account via Plaid (US/UK/CA) or Basiq (AU):</p>
          <Ul items={[
            'We request read-only access to your transaction history — we cannot initiate payments or transfers',
            'Your bank login credentials are entered directly into Plaid\'s or Basiq\'s secure interface and are never seen or stored by us',
            'Plaid and Basiq return transaction records to us, which we store and display in your dashboard',
            'You can disconnect your bank account at any time from the Transactions page',
          ]} />
        </Sub>

        <Sub title="2.7 Payment Information (Stripe)">
          <Ul items={[
            'We use Stripe to process Premium subscription payments',
            'We do not store, see, or have access to your credit or debit card numbers',
            'Stripe stores your payment details and we receive only a tokenised reference',
            'We store your Stripe customer ID and subscription status to manage your account',
          ]} />
        </Sub>

        <Sub title="2.8 Technical and Usage Data">
          <Ul items={[
            'Authentication session tokens (managed by Supabase, stored as encrypted cookies)',
            'Device type and browser (collected by Supabase for session management)',
            'We do not run third-party analytics, tracking pixels, or advertising scripts',
          ]} />
        </Sub>

        <Sub title="2.9 Referral Programme Data">
          <p>If you participate in the Refer &amp; Earn programme, we collect and process the following additional data:</p>
          <Ul items={[
            'Your unique referral code (auto-generated or custom, linked to your account)',
            'Email addresses of people you invite — these are third-party email addresses you provide to us for the purpose of sending a single invitation and up to three follow-up reminder emails',
            'A record of each invite sent, including the date, reminder count, and whether the invitee subscribed',
            'Referral credit records: the amount earned, date earned, and payout status',
            'If you set up cash payouts: your Stripe Connect account ID and KYC verification status (identity verification is handled by Stripe, not us)',
            'Unsubscribe tokens, which allow invitees to opt out of reminder emails',
          ]} />
          <p className="mt-2">
            <strong className="text-white">Important (APP 5 disclosure):</strong> When you provide a third party's email address to send an invitation, we collect that email address on your behalf. We use it only to send the invitation and up to three monthly reminder emails. We do not use invitee email addresses for any other purpose. Invitees can unsubscribe at any time using the link in each email, after which we will not contact them again.
          </p>
        </Sub>
      </Section>

      <Section id="pp-use" title="3. How We Use Your Information">
        <p>We use your information solely to operate and improve the Service:</p>
        <Ul items={[
          'To create and manage your account',
          'To calculate and display your personalised retirement age, savings projections, and financial health score',
          'To display your transaction history, budget performance, and spending insights',
          'To display leaderboard rankings using your anonymous username and computed scores',
          'To generate your monthly and annual financial statements',
          'To process your Premium subscription payments via Stripe',
          'To sync bank transactions (Premium users, via Plaid and Basiq)',
          'To send account-related emails (e.g. password reset — we do not send marketing emails without your explicit consent)',
          'To operate the Refer & Earn programme: to send invitation and reminder emails to addresses you provide, apply referral credits to your account, and process cash payouts via Stripe Connect',
          'To investigate and respond to support requests',
          'To detect and prevent fraud or abuse, including referral credit fraud',
        ]} />
        <p className="mt-3 text-white/70">
          <strong className="text-white">We do not use your financial data for advertising, profiling for third parties, credit scoring, or any purpose other than operating the Service.</strong>
        </p>
      </Section>

      <Section id="pp-sharing" title="4. Data Sharing and Disclosure">
        <p><strong className="text-white">We do not sell, rent, lease, or trade your personal information to any third party.</strong></p>
        <p>We share data only in the following limited circumstances:</p>

        <Sub title="4.1 Service Providers">
          <p>We share data with the following providers strictly as necessary to operate the Service:</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wide pb-2 pr-4">Provider</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wide pb-2 pr-4">Purpose</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wide pb-2">Privacy policy</th>
                </tr>
              </thead>
              <tbody>
                <TableRow service="Supabase" purpose="Database, authentication, and file storage" link="supabase.com/privacy" />
                <TableRow service="Vercel" purpose="Application hosting and CDN" link="vercel.com/legal/privacy-policy" />
                <TableRow service="Stripe" purpose="Payment processing (Premium subscriptions)" link="stripe.com/privacy" />
                <TableRow service="Plaid" purpose="Bank transaction sync — US, UK, Canada (Premium)" link="plaid.com/legal/privacy-notice" />
                <TableRow service="Basiq" purpose="Bank transaction sync — Australia (Premium)" link="basiq.io/privacy-policy" />
                <TableRow service="Resend" purpose="Transactional email delivery (referral invites, credit notifications)" link="resend.com/legal/privacy-policy" />
                <TableRow service="Google" purpose="OAuth sign-in (if you choose to sign in with Google)" link="policies.google.com/privacy" />
              </tbody>
            </table>
          </div>
          <p className="mt-3">Each of these providers has their own privacy policy governing how they handle data. We encourage you to review them.</p>
        </Sub>

        <Sub title="4.2 Legal Requirements">
          <p>We may disclose your personal information if required to do so by law, court order, or government request, or if we believe disclosure is necessary to:</p>
          <Ul items={[
            'Comply with a legal obligation',
            'Protect the rights or safety of our users or the public',
            'Prevent or investigate fraud or security issues',
          ]} />
        </Sub>

        <Sub title="4.3 Business Transfers">
          <p>If {COMPANY} is involved in a merger, acquisition, or sale of assets, your personal information may be transferred as part of that transaction. We will notify you via email and/or a prominent notice on the Service before your data is transferred.</p>
        </Sub>
      </Section>

      <Section id="pp-security" title="5. Data Storage and Security">
        <Sub title="5.1 Where Your Data Is Stored">
          <p>Your data is stored in Supabase's managed PostgreSQL database, hosted on AWS infrastructure. Supabase is SOC 2 Type II certified. Data may be stored in data centres located in Australia, the United States, or the European Union depending on your Supabase region configuration.</p>
        </Sub>

        <Sub title="5.2 Security Measures">
          <Ul items={[
            'All data transmitted between your device and our servers is encrypted using TLS 1.2 or higher',
            'Data at rest is encrypted using AES-256',
            'Passwords are hashed using bcrypt and never stored in plain text',
            'Row-level security (RLS) policies in our database ensure users can only access their own data',
            'Bank credentials (Plaid/Basiq) are never transmitted to or stored by us',
            'Payment card details are never stored by us — Stripe handles all card data in their PCI DSS compliant environment',
            'Access to production databases is restricted to authorised personnel only',
          ]} />
        </Sub>

        <Sub title="5.3 Security Incidents">
          <p>In the event of a data breach that is likely to result in serious harm to you, we will notify you and any relevant regulatory authorities as required by law, including within the timeframes required under the Australian Privacy Act 1988 (Notifiable Data Breaches scheme).</p>
        </Sub>
      </Section>

      <Section id="pp-retention" title="6. Data Retention">
        <Ul items={[
          'Account and financial data is retained for as long as your account is active',
          'If you delete your account, we will delete your personal data within 30 days, except where we are legally required to retain it',
          'Bank-synced transaction data is retained while your account is active and deleted upon account closure',
          'Payment records (invoices, transaction IDs) may be retained for up to 7 years for tax and legal compliance',
          'Anonymised, aggregated data (which cannot identify you) may be retained indefinitely for service improvement',
          'Referral invite records (third-party email addresses you provided) are retained until the invitee unsubscribes, converts to a user and closes their account, or you close your account — whichever comes first',
          'Referral credit and payout records may be retained for up to 7 years for financial compliance purposes',
          'Data stored in your browser\'s localStorage (streaks, preferences) is under your control and not subject to our retention policy',
        ]} />
      </Section>

      <Section id="pp-rights" title="7. Your Privacy Rights">
        <p>Depending on your location, you may have the following rights regarding your personal information:</p>

        <Sub title="7.1 Access">
          <p>You may request a copy of all personal data we hold about you. You can export your transaction data at any time using the CSV export feature (Premium) or by contacting us at <span className="text-cyan-400">{CONTACT_EMAIL}</span>.</p>
        </Sub>

        <Sub title="7.2 Correction">
          <p>You can update your account information and financial profile at any time from your settings within the app.</p>
        </Sub>

        <Sub title="7.3 Deletion">
          <p>You may request deletion of your account and all associated personal data by contacting us at <span className="text-cyan-400">{CONTACT_EMAIL}</span>. We will process your request within 30 days.</p>
        </Sub>

        <Sub title="7.4 Bank Disconnection">
          <p>You may disconnect any linked bank account at any time from the Transactions page. This will prevent future transaction syncing, but previously synced transactions will remain in your history unless you delete them.</p>
        </Sub>

        <Sub title="7.5 Withdrawal of Consent">
          <p>You may close your account and stop using the Service at any time. Premium subscriptions can be cancelled via the Upgrade page at any time; cancellation takes effect at the end of your current billing period.</p>
        </Sub>

        <Sub title="7.6 Complaints">
          <p>If you believe we have not handled your personal information in accordance with applicable privacy law, you may lodge a complaint with:</p>
          <Ul items={[
            'Us directly at ' + CONTACT_EMAIL + ' — we will respond within 30 days',
            'The Office of the Australian Information Commissioner (OAIC) at oaic.gov.au (for Australian users)',
            'Your national data protection authority (for EU/UK users)',
          ]} />
        </Sub>
      </Section>

      <Section id="pp-aus" title="8. Australian Privacy Act Compliance">
        <p>
          {COMPANY} is committed to complying with the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles (APPs).
          This includes our obligations regarding the collection, use, disclosure, quality, security, and access to your personal information.
        </p>
        <p>
          We only collect information that is reasonably necessary to provide the Service. We do not collect sensitive information (such as health information or biometrics) and do not use your data for direct marketing unless you have explicitly consented.
        </p>
        <p>
          When we engage overseas providers (such as Supabase, Stripe, and Plaid), we take reasonable steps to ensure they handle your data in accordance with the APPs.
        </p>
      </Section>

      <Section id="pp-gdpr" title="9. GDPR — European Users">
        <p>
          If you are located in the European Economic Area (EEA) or United Kingdom, you have additional rights under the General Data Protection Regulation (GDPR) and UK GDPR, including the right to data portability, the right to object to processing, and the right to restriction of processing.
        </p>
        <p>Our legal bases for processing your data under GDPR are:</p>
        <Ul items={[
          'Contract performance — processing necessary to provide the Service you signed up for',
          'Legitimate interests — fraud prevention, security monitoring, and service improvement',
          'Legal obligation — where we are required to retain records for compliance purposes',
          'Consent — where we have obtained your explicit consent (e.g. marketing communications)',
        ]} />
        <p>To exercise your GDPR rights, contact us at <span className="text-cyan-400">{CONTACT_EMAIL}</span>.</p>
      </Section>

      <Section id="pp-children" title="10. Children's Privacy">
        <p>
          The Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from anyone under 18. If you believe a child under 18 has provided us with personal information, please contact us at <span className="text-cyan-400">{CONTACT_EMAIL}</span> and we will delete it promptly.
        </p>
      </Section>

      <Section id="pp-cookies" title="11. Cookies and Local Storage">
        <Sub title="11.1 Cookies">
          <p>We use minimal cookies, limited to:</p>
          <Ul items={[
            'Supabase authentication session cookies — strictly necessary to keep you logged in',
            'We do not use advertising cookies, tracking pixels, or third-party analytics cookies',
          ]} />
        </Sub>
        <Sub title="11.2 localStorage">
          <p>We use your browser's localStorage to store non-sensitive preference and engagement data (streak, health score, check-in history) entirely on your device. This data never leaves your browser and is not accessible to us. You can clear it at any time by clearing your browser data.</p>
        </Sub>
      </Section>

      <Section id="pp-changes" title="12. Changes to This Privacy Policy">
        <p>
          We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page with an updated "Last updated" date, and where appropriate, by sending an email notification to your registered address.
        </p>
        <p>Your continued use of the Service after changes are posted constitutes your acceptance of the updated policy.</p>
      </Section>

      <Section id="pp-contact" title="13. Contact Us">
        <p>For any privacy-related questions, requests, or concerns, please contact us:</p>
        <div className="mt-3 glass rounded-xl p-4" style={{ borderColor: 'rgba(0,212,255,0.15)' }}>
          <p className="text-white font-semibold">{COMPANY}</p>
          <p className="text-cyan-400 mt-1">{CONTACT_EMAIL}</p>
          <p className="text-slate-500 text-xs mt-2">We aim to respond to all privacy enquiries within 30 days.</p>
        </div>
      </Section>
    </>
  )
}

// ── Terms & Conditions content ────────────────────────────────────────────────

function TermsContent() {
  return (
    <>
      <Section id="tc-intro" title="1. Acceptance of Terms">
        <p>
          These Terms and Conditions ("Terms") govern your access to and use of the {COMPANY} platform at {DOMAIN} (the "Service"), operated by {COMPANY} ("we", "us", "our").
        </p>
        <p>
          By creating an account, accessing the Service, or clicking "I agree", you confirm that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree, you must not use the Service.
        </p>
        <p>
          You must be at least 18 years old to use the Service.
        </p>
        <p className="text-slate-500 text-xs">Last updated: {LAST_UPDATED}</p>
      </Section>

      <Section id="tc-service" title="2. Description of Service">
        <p>
          {COMPANY} is a personal finance and retirement planning platform that provides tools including:
        </p>
        <Ul items={[
          'Retirement age calculator and savings projections',
          'Transaction tracking (manual and bank-synced via Plaid and Basiq)',
          'Budget targets, budget limits, and spending insights',
          'Savings goals, net worth tracker, and debt payoff calculator',
          'Tax estimate tool (for AU, US, UK, and CA — for estimation purposes only)',
          'Bills tracker and upcoming payments widget',
          'Investment strategy educational content',
          'Financial health score and engagement features',
          'Anonymous community leaderboard',
          'Monthly and annual financial statements (Premium)',
          'Bank account connection and automatic transaction import (Premium)',
        ]} />
        <p>
          The Service is provided for personal, non-commercial use. We reserve the right to modify, suspend, or discontinue any part of the Service at any time.
        </p>
      </Section>

      <Section id="tc-accounts" title="3. User Accounts">
        <Sub title="3.1 Registration">
          <p>To access most features, you must create an account with a valid email address and password, or sign in using Google. You must provide accurate and complete information.</p>
        </Sub>
        <Sub title="3.2 Account Security">
          <Ul items={[
            'You are responsible for maintaining the confidentiality of your account credentials',
            'You are responsible for all activity that occurs under your account',
            'You must notify us immediately at ' + CONTACT_EMAIL + ' if you suspect unauthorised access',
            'We are not liable for any loss resulting from unauthorised use of your account',
            'You may not share your account with others or create accounts on behalf of others without their consent',
          ]} />
        </Sub>
        <Sub title="3.3 Usernames">
          <p>If you choose a username for the leaderboard, you agree not to use a name that is offensive, misleading, or impersonates another person or brand. We reserve the right to remove or change usernames that violate these guidelines.</p>
        </Sub>
      </Section>

      <Section id="tc-subscription" title="4. Subscriptions and Billing">
        <Sub title="4.1 Free Tier">
          <p>The free tier of {COMPANY} is available at no cost and includes the core financial planning tools, engagement features, and leaderboard. The free tier does not include bank account sync, CSV export, or Reports.</p>
        </Sub>
        <Sub title="4.2 Premium Subscription">
          <p>Premium is available for <strong className="text-white">$9.00 AUD per month</strong> or <strong className="text-white">$79.00 AUD per year</strong> (approximately 26% saving). Premium includes:</p>
          <Ul items={[
            'Bank account sync via Plaid (US/UK/CA) and Basiq (AU)',
            'Automatic transaction import',
            'CSV transaction export',
            '12-month history charts and reports',
            'Monthly and annual PDF statements',
            'Financial summary PDF report',
            'Priority support',
          ]} />
        </Sub>
        <Sub title="4.3 Billing and Auto-Renewal">
          <Ul items={[
            'Subscriptions are billed in advance on a monthly or annual basis',
            'Your subscription will automatically renew at the end of each billing period unless cancelled',
            'You authorise us to charge your payment method for the applicable subscription fee at each renewal',
            'Prices are in Australian dollars (AUD) and are inclusive of any applicable taxes',
            'We reserve the right to change subscription pricing with at least 30 days\' notice',
          ]} />
        </Sub>
        <Sub title="4.4 Cancellation">
          <p>You may cancel your Premium subscription at any time via the Upgrade page (Manage Subscription → Stripe Customer Portal). Cancellation takes effect at the end of your current billing period — you retain Premium access until then. We do not provide pro-rated refunds for partial billing periods.</p>
        </Sub>
        <Sub title="4.5 Refund Policy">
          <p>We offer a full refund within <strong className="text-white">7 days</strong> of your initial subscription purchase if you are not satisfied. After this period, refunds are provided at our discretion. To request a refund, contact <span className="text-cyan-400">{CONTACT_EMAIL}</span>.</p>
        </Sub>
        <Sub title="4.6 Failed Payments">
          <p>If a payment fails, Stripe will attempt to retry the charge. If payment cannot be collected, your account may be downgraded to the free tier. You will be notified by email before this occurs.</p>
        </Sub>
      </Section>

      <Section id="tc-financial" title="5. Financial Disclaimer">
        <p className="text-amber-400/90 font-medium">
          Important: {COMPANY} is a financial planning and education tool. It does not provide financial advice, investment advice, tax advice, or legal advice.
        </p>
        <Ul items={[
          'All retirement projections, savings calculations, and investment return figures are estimates based on the inputs you provide and assumed average annual returns. They are illustrative only and do not guarantee future outcomes.',
          'Actual investment returns vary and can be negative. Past performance does not predict future results.',
          'Tax estimates provided by the Service are approximations for educational purposes. They are not a substitute for professional tax advice and should not be used to lodge a tax return.',
          'The investment strategy content on the Service is educational and uses hypothetical examples. It is not a recommendation to buy, sell, or hold any investment product.',
          'You should seek independent financial, legal, and tax advice from a licensed professional before making any financial decisions.',
          `${COMPANY} is not an Australian Financial Services Licence (AFSL) holder and does not provide regulated financial advice.`,
        ]} />
      </Section>

      <Section id="tc-bank" title="6. Bank Account Connection (Premium)">
        <Sub title="6.1 Read-Only Access">
          <p>Bank sync via Plaid (US/UK/CA) and Basiq (AU) provides <strong className="text-white">read-only access</strong> to your transaction history. We cannot and do not initiate any payments, transfers, or other actions on your bank accounts.</p>
        </Sub>
        <Sub title="6.2 Third-Party Terms">
          <p>Your use of bank sync is also subject to Plaid's End User Privacy Policy and Basiq's Terms of Service. By connecting a bank account, you agree to those terms.</p>
        </Sub>
        <Sub title="6.3 Data Accuracy">
          <p>We do not guarantee the accuracy, completeness, or timeliness of bank-synced transactions. Pending transactions may appear differently once settled. You should verify important transactions against your official bank statements.</p>
        </Sub>
      </Section>

      <Section id="tc-acceptable" title="7. Acceptable Use">
        <p>You agree not to:</p>
        <Ul items={[
          'Use the Service for any unlawful purpose or in violation of any applicable laws',
          'Provide false, inaccurate, or misleading information to the Service',
          'Attempt to gain unauthorised access to any other user\'s account or data',
          'Use the Service to process transactions or data on behalf of third parties without their consent',
          'Scrape, copy, or redistribute any content or data from the Service without our written permission',
          'Introduce viruses, malware, or any other harmful code into the Service',
          'Attempt to reverse engineer, decompile, or disassemble any part of the Service',
          'Use the Service in any manner that could damage, disable, or impair the Service or its servers',
          'Create a username on the leaderboard that is offensive, defamatory, or impersonates another person',
        ]} />
      </Section>

      <Section id="tc-ip" title="8. Intellectual Property">
        <p>
          The Service and all its content, features, and functionality — including but not limited to the software, design, text, graphics, and logos — are owned by {COMPANY} and are protected by copyright and other intellectual property laws.
        </p>
        <p>
          You are granted a limited, non-exclusive, non-transferable licence to access and use the Service for your personal, non-commercial use. You may not reproduce, distribute, modify, or create derivative works of any part of the Service without our prior written consent.
        </p>
        <p>
          Your personal financial data entered into or generated by the Service remains yours. We do not claim ownership over your financial data.
        </p>
      </Section>

      <Section id="tc-liability" title="9. Limitation of Liability">
        <p>
          To the maximum extent permitted by applicable law:
        </p>
        <Ul items={[
          'The Service is provided "as is" and "as available" without warranty of any kind, express or implied',
          `${COMPANY} does not warrant that the Service will be uninterrupted, error-free, or free from viruses or harmful components`,
          `${COMPANY} is not liable for any loss or damage arising from your reliance on financial projections, tax estimates, or other calculations provided by the Service`,
          `${COMPANY} is not liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of or inability to use the Service`,
          `${COMPANY} is not responsible for any losses caused by bank sync errors, data inaccuracies from third-party providers (Plaid, Basiq), or payment processing issues`,
          'Our total liability to you for any claim arising out of or relating to the Service shall not exceed the amount you paid to us in the 12 months preceding the claim',
        ]} />
        <p>
          Nothing in these Terms excludes or limits any right or remedy you may have under the Australian Consumer Law or other applicable mandatory consumer protection legislation, including any guarantees that cannot be excluded by law.
        </p>
      </Section>

      <Section id="tc-indemnity" title="10. Indemnification">
        <p>
          You agree to indemnify, defend, and hold harmless {COMPANY} and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including legal fees) arising out of or relating to:
        </p>
        <Ul items={[
          'Your use of the Service in violation of these Terms',
          'Your violation of any applicable law or regulation',
          'Your violation of any third party\'s rights',
          'Any false or inaccurate information you provide to the Service',
        ]} />
      </Section>

      <Section id="tc-termination" title="11. Account Termination">
        <Sub title="11.1 By You">
          <p>You may delete your account at any time by contacting us at <span className="text-cyan-400">{CONTACT_EMAIL}</span>. Upon deletion, your data will be permanently removed within 30 days in accordance with our Privacy Policy.</p>
        </Sub>
        <Sub title="11.2 By Us">
          <p>We reserve the right to suspend or terminate your account, with or without notice, if we reasonably believe you have:</p>
          <Ul items={[
            'Violated these Terms or our Privacy Policy',
            'Provided false information during registration',
            'Engaged in fraudulent, abusive, or harmful behaviour',
            'Failed to pay applicable subscription fees',
          ]} />
          <p>If we terminate your account without cause, we will provide a pro-rated refund for any unused paid subscription period.</p>
        </Sub>
      </Section>

      <Section id="tc-thirdparty" title="12. Third-Party Services and Links">
        <p>
          The Service integrates with third-party services including Plaid, Basiq, Stripe, Google, Supabase, and Vercel. Your use of these services is governed by their respective terms and privacy policies. We are not responsible for the practices of any third-party service providers.
        </p>
        <p>
          The investment strategy pages may reference third-party ETFs, brokers, and financial platforms by name for educational purposes only. This does not constitute an endorsement, recommendation, or affiliation with any such product or provider.
        </p>
      </Section>

      <Section id="tc-availability" title="13. Service Availability">
        <p>
          We aim to keep the Service available 24/7, but we do not guarantee uninterrupted availability. Scheduled maintenance, updates, and events outside our control (such as outages from Supabase, Vercel, or other infrastructure providers) may cause temporary interruptions.
        </p>
        <p>
          We are not liable for any loss or inconvenience caused by downtime or interruptions to the Service.
        </p>
      </Section>

      <Section id="tc-governing" title="14. Governing Law and Dispute Resolution">
        <p>
          These Terms are governed by and construed in accordance with the laws of New South Wales, Australia, without regard to conflict of law provisions.
        </p>
        <p>
          Any dispute arising out of or in connection with these Terms shall first be attempted to be resolved through good-faith negotiation. If the dispute cannot be resolved informally within 30 days, it shall be submitted to the exclusive jurisdiction of the courts of New South Wales, Australia.
        </p>
        <p>
          If you are a consumer in a jurisdiction with mandatory consumer protection laws, nothing in these Terms limits any rights you may have under those laws.
        </p>
      </Section>

      <Section id="tc-changes" title="15. Changes to These Terms">
        <p>
          We reserve the right to update these Terms at any time. When we make material changes, we will notify you by updating the "Last updated" date at the top of this page and, where appropriate, by sending an email to your registered address.
        </p>
        <p>
          Your continued use of the Service after changes become effective constitutes your acceptance of the revised Terms. If you do not agree to the revised Terms, you must stop using the Service and may delete your account.
        </p>
      </Section>

      <Section id="tc-referral" title="17. Refer & Earn Programme">
        <Sub title="17.1 How It Works">
          <p>
            {COMPANY} offers a Refer &amp; Earn programme that rewards you with account credit when someone subscribes to Premium using your referral link or code.
          </p>
          <Ul items={[
            'Each user is assigned a unique referral code, which can be customised from the Refer & Earn page',
            'You earn $1 AUD in account credit for each person who subscribes to Premium using your referral link — credit is applied only after their payment is confirmed',
            'Credits automatically reduce your next subscription charge (e.g. 9 credits = one free month)',
            'When your total unused credits exceed your monthly subscription cost, the surplus is eligible for cash payout',
          ]} />
        </Sub>

        <Sub title="17.2 Cash Payouts">
          <Ul items={[
            'Cash payouts are available via Stripe Connect when your payout-eligible balance reaches a minimum of $5 AUD',
            'To receive cash payouts, you must complete identity verification (KYC) through Stripe Connect Express — this is a legal requirement for processing payments',
            'Payouts are processed in AUD and transferred to your connected bank account or debit card via Stripe',
            'Payout processing times are subject to Stripe\'s standard transfer timelines (typically 2–5 business days)',
            `${COMPANY} is not responsible for delays caused by Stripe or your financial institution`,
          ]} />
        </Sub>

        <Sub title="17.3 Eligibility and Anti-Abuse Rules">
          <p>To maintain the integrity of the programme, the following rules apply:</p>
          <Ul items={[
            'You cannot refer yourself — using your own referral code on your own account is not permitted and will not earn a credit',
            'Only one credit is ever earned per referred user, regardless of how many times they are invited or how many referral codes they encounter',
            'Credits are only awarded after a referred user\'s first Premium payment is successfully processed — incomplete or refunded payments do not qualify',
            'You may send up to 20 referral invitations per day via email',
            `${COMPANY} reserves the right to withhold, reverse, or forfeit referral credits if we reasonably suspect fraudulent activity, including but not limited to creating fake accounts, using automated sign-up tools, or any other manipulation of the programme`,
            'Referral credits have no cash value outside of the payout mechanism described above and cannot be transferred between accounts',
          ]} />
        </Sub>

        <Sub title="17.4 Programme Changes">
          <p>
            {COMPANY} reserves the right to modify, suspend, or discontinue the Refer &amp; Earn programme at any time with 30 days\' notice where reasonably practicable. Any credits earned prior to discontinuation will be honoured for a period of 90 days after notice is given.
          </p>
        </Sub>
      </Section>

      <Section id="tc-contact" title="18. Contact Us">
        <p>If you have any questions about these Terms, please contact us:</p>
        <div className="mt-3 glass rounded-xl p-4" style={{ borderColor: 'rgba(0,212,255,0.15)' }}>
          <p className="text-white font-semibold">{COMPANY}</p>
          <p className="text-cyan-400 mt-1">{CONTACT_EMAIL}</p>
        </div>
      </Section>
    </>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'privacy', label: 'Privacy Policy' },
  { key: 'terms',   label: 'Terms & Conditions' },
]

const PP_TOC = [
  { id: 'pp-intro',    label: '1. Introduction' },
  { id: 'pp-collect',  label: '2. Information We Collect' },
  { id: 'pp-use',      label: '3. How We Use Your Information' },
  { id: 'pp-sharing',  label: '4. Data Sharing' },
  { id: 'pp-security', label: '5. Data Storage & Security' },
  { id: 'pp-retention',label: '6. Data Retention' },
  { id: 'pp-rights',   label: '7. Your Privacy Rights' },
  { id: 'pp-aus',      label: '8. Australian Privacy Act' },
  { id: 'pp-gdpr',     label: '9. GDPR (EU Users)' },
  { id: 'pp-children', label: '10. Children\'s Privacy' },
  { id: 'pp-cookies',  label: '11. Cookies & localStorage' },
  { id: 'pp-changes',  label: '12. Changes to Policy' },
  { id: 'pp-contact',  label: '13. Contact Us' },
]

const TC_TOC = [
  { id: 'tc-intro',        label: '1. Acceptance of Terms' },
  { id: 'tc-service',      label: '2. Description of Service' },
  { id: 'tc-accounts',     label: '3. User Accounts' },
  { id: 'tc-subscription', label: '4. Subscriptions & Billing' },
  { id: 'tc-financial',    label: '5. Financial Disclaimer' },
  { id: 'tc-bank',         label: '6. Bank Account Connection' },
  { id: 'tc-acceptable',   label: '7. Acceptable Use' },
  { id: 'tc-ip',           label: '8. Intellectual Property' },
  { id: 'tc-liability',    label: '9. Limitation of Liability' },
  { id: 'tc-indemnity',    label: '10. Indemnification' },
  { id: 'tc-termination',  label: '11. Account Termination' },
  { id: 'tc-thirdparty',   label: '12. Third-Party Services' },
  { id: 'tc-availability', label: '13. Service Availability' },
  { id: 'tc-governing',    label: '14. Governing Law' },
  { id: 'tc-changes',      label: '15. Changes to Terms' },
  { id: 'tc-referral',     label: '17. Refer & Earn Programme' },
  { id: 'tc-contact',      label: '18. Contact' },
]

export default function PrivacyPolicyPage() {
  const [tab, setTab] = useState('privacy')
  const toc = tab === 'privacy' ? PP_TOC : TC_TOC

  return (
    <div className="min-h-screen bg-space-900 text-white">

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 glass border-b border-cyan-glow/10">
        <Link to="/" className="text-xl font-bold text-gradient">Retirely</Link>
        <nav className="hidden md:flex items-center gap-8 text-slate-400 text-sm">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <Link to="/about" className="hover:text-white transition-colors">About</Link>
          <Link to="/privacy" className="text-white">Privacy & Terms</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login"
            className="px-5 py-2 rounded-lg font-semibold text-sm text-slate-300 hover:text-white transition-colors glass">
            Log in
          </Link>
          <Link to="/login"
            className="px-5 py-2 rounded-lg font-semibold text-white text-sm transition-all duration-300 hover:glow-cyan"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-8">
        <div className="mb-3">
          <span className="text-xs font-medium text-cyan-400 uppercase tracking-widest">Legal</span>
        </div>
        <h1 className="text-4xl font-bold mb-3">Privacy Policy &amp; Terms</h1>
        <p className="text-slate-400 mb-2">
          We believe in transparency. Here is exactly how {COMPANY} handles your data and what you agree to when using the Service.
        </p>
        <p className="text-slate-600 text-xs">Last updated: {LAST_UPDATED}</p>

        {/* Key commitment strip */}
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {[
            { icon: '🔒', title: 'We never sell your data', desc: 'Your financial information is never sold, rented, or traded to any third party.' },
            { icon: '🏦', title: 'Read-only bank access', desc: 'Bank sync is read-only. We cannot make payments or transfers on your behalf.' },
            { icon: '🗑️', title: 'Delete any time', desc: 'You can close your account and have all your data permanently deleted within 30 days.' },
          ].map(c => (
            <div key={c.title} className="glass rounded-xl p-4 flex gap-3" style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
              <span className="text-2xl shrink-0">{c.icon}</span>
              <div>
                <p className="text-white font-semibold text-sm mb-0.5">{c.title}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab selector */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 mb-8">
        <div className="flex gap-1 glass rounded-xl p-1 w-fit">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              style={tab === t.key
                ? { background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', color: '#fff' }
                : { color: '#64748b' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content + TOC */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pb-20 flex gap-10 items-start">

        {/* Table of contents — sticky on desktop */}
        <aside className="hidden lg:block w-52 shrink-0 sticky top-28">
          <p className="text-xs text-slate-600 uppercase tracking-widest mb-3">Contents</p>
          <nav className="flex flex-col gap-0.5">
            {toc.map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="text-xs text-slate-500 hover:text-cyan-400 transition-colors py-1 leading-snug"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Document */}
        <div className="flex-1 min-w-0">
          <div className="glass rounded-2xl p-8 md:p-10" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {tab === 'privacy' ? <PrivacyContent /> : <TermsContent />}
          </div>
        </div>
      </div>

      <footer className="relative z-10 text-center text-slate-600 text-sm py-8 border-t border-white/5">
        © {new Date().getFullYear()} Retirely ·{' '}
        <Link to="/about" className="hover:text-slate-400 transition-colors">About</Link> ·{' '}
        <Link to="/privacy" className="hover:text-slate-400 transition-colors">Privacy & Terms</Link> ·{' '}
        <Link to="/" className="hover:text-slate-400 transition-colors">Home</Link>
      </footer>
    </div>
  )
}
