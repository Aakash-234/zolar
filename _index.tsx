import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { ArrowRight, CheckCircle, FileCheck, Bot, ShieldCheck } from 'lucide-react';
import styles from './_index.module.css';

const features = [
  {
    icon: <Bot size={24} />,
    title: 'AI-Powered OCR & Extraction',
    description: 'Utilize cutting-edge OCR and LLMs to automatically extract data from any document—IDs, rebate forms, loan agreements, and more.',
  },
  {
    icon: <FileCheck size={24} />,
    title: 'Automated Validation',
    description: 'Our system instantly validates extracted information, highlighting discrepancies and missing fields to ensure accuracy before manual review.',
  },
  {
    icon: <CheckCircle size={24} />,
    title: 'Streamlined Ops Dashboard',
    description: 'A central hub for your operations team to review, override, and approve documents with a clear, intuitive interface.',
  },
  {
    icon: <ShieldCheck size={24} />,
    title: 'Compliance & Audit Trail',
    description: 'Maintain a complete, immutable audit trail for every document, ensuring full compliance and providing peace of mind.',
  },
];

export default function LandingPage() {
  return (
    <>
      <Helmet>
        <title>Floot | AI-Powered Clean Energy Document Automation</title>
        <meta
          name="description"
          content="Automate document verification for solar, heat pump, and battery installations. Floot uses AI to streamline your workflow, reduce errors, and accelerate project completion."
        />
      </Helmet>
      <div className={styles.pageWrapper}>
        <header className={styles.header}>
          <div className={styles.logo}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Zolar</span>
          </div>
          <nav className={styles.nav}>
            <Button variant="ghost" asChild>
              <Link to="/dashboard">Log In</Link>
            </Button>
            <Button asChild>
              <Link to="/dashboard">
                Get Started <ArrowRight size={16} />
              </Link>
            </Button>
          </nav>
        </header>

        <main className={styles.mainContent}>
          {/* Hero Section */}
          <section className={styles.hero}>
            <div className={styles.heroContent}>
              <Badge variant="secondary" className={styles.heroBadge}>Powering Worlds's Green Transition</Badge>
              <h1 className={styles.heroTitle}>
                Automate Your Clean Energy Document Workflow.
              </h1>
              <p className={styles.heroSubtitle}>
                Floot uses AI to verify, validate, and manage installation documents, so you can focus on what matters: building a sustainable future.
              </p>
              <div className={styles.heroActions}>
                <Button size="lg" asChild>
                  <Link to="/dashboard">
                    Start Automating Now <ArrowRight size={20} />
                  </Link>
                </Button>
                <Button size="lg" variant="outline">
                  Request a Demo
                </Button>
              </div>
            </div>
            <div className={styles.heroImageContainer}>
              <img
                src="https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1200&q=80"
                alt="Clean energy installation"
                className={styles.heroImage}
              />
              <div className={styles.heroImageOverlay}></div>
            </div>
          </section>

          {/* Features Section */}
          <section className={styles.featuresSection}>
            <div className={styles.featuresContent}>
              <h2 className={styles.sectionTitle}>The Future of Installation Management</h2>
              <p className={styles.sectionSubtitle}>
                Eliminate manual data entry, reduce costly errors, and accelerate your project timelines with our intelligent automation platform.
              </p>
              <div className={styles.featuresGrid}>
                {features.map((feature) => (
                  <div key={feature.title} className={styles.featureCard}>
                    <div className={styles.featureIcon}>{feature.icon}</div>
                    <h3 className={styles.featureTitle}>{feature.title}</h3>
                    <p className={styles.featureDescription}>{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className={styles.ctaSection}>
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>Ready to Revolutionize Your Workflow?</h2>
              <p className={styles.ctaText}>
                Join the growing number of European installers using Floot to build faster, smarter, and more efficiently.
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link to="/dashboard">
                  Get Started for Free <ArrowRight size={20} />
                </Link>
              </Button>
            </div>
          </section>
        </main>

        <footer className={styles.footer}>
          <p>&copy; {new Date().getFullYear()} Floot. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}