import React from 'react';

// Design Tokens (based on requirements)
const tokens = {
  colors: {
    bgPrimary: '#1A1A1A',
    bgSecondary: '#2D2D2D',
    bgSurface: '#3A3A3A',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textTertiary: '#707070',
    accentPrimary: '#FF6B2C',
    accentHover: '#FF5A1A',
    success: '#00D9FF',
    borderSubtle: '#404040',
  },
  typography: {
    familyBase: 'Inter, system-ui, sans-serif',
    sizeXs: '12px',
    sizeSm: '14px',
    sizeBase: '16px',
    sizeLg: '18px',
    size2xl: '24px',
    sizeH2: '36px',
    sizeH1: '48px',
    weightRegular: 400,
    weightSemibold: 600,
    weightBold: 700,
  },
  spacing: {
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '4xl': '80px',
  },
  radius: {
    sm: '6px',
    md: '8px',
    lg: '16px',
    pill: '100px',
  },
  shadows: {
    md: '0px 4px 12px rgba(0,0,0,0.12)',
    lg: '0px 12px 32px rgba(0,0,0,0.16)',
  }
};

interface AppData {
  name: string;
  status: 'LIVE' | 'COMING SOON';
  logo: string; // Description of logo or icon
  ctaText: string;
  ctaUrl: string;
  description: string;
  features: string[];
}

const apps: AppData[] = [
  {
    name: 'FifthSense',
    status: 'LIVE',
    logo: 'Circle of Fifths or Treble Clef',
    ctaText: 'Try FifthSense',
    ctaUrl: 'https://fifthsense.moshly.io',
    description: 'FifthSense is an interactive Circle of Fifths reference tool built for musicians, producers, and educators. It provides real-time harmonic relationships, chord progressions, and key signatures with visual feedback. The app features three distinct visual themes (Darkly, Coder, Moshly) to adapt to different workflow contexts and accessibility needs. Whether you\'re analyzing existing music, composing new material, or teaching harmonic theory, FifthSense offers a responsive, beautiful interface that makes complex music theory intuitive and immediately applicable. Built with modern web standards and deployed via Cloudflare Pages for instant global availability.',
    features: ['Interactive Circle of Fifths', 'Multiple visual themes', 'Harmonic analysis', 'Real-time feedback']
  },
  {
    name: 'MerchPad',
    status: 'COMING SOON',
    logo: 'Shopping bag or Tally counter',
    ctaText: 'Join Waitlist',
    ctaUrl: 'https://moshly.io/waitlist?app=merchpad',
    description: 'MerchPad is a purpose-built point-of-sale interface designed for live event merchandise sales, optimized for tour managers and street teams. The interface features a large Tally Counter-style button layout (+/− per variant) with real-time stock visualization by color, ensuring you never miss a sale due to unclear availability. A single [CONFIRM SALE] batch action completes transactions with audit trail logging. Built on D1 (Cloudflare\'s SQLite) with offline-first architecture via IndexedDB, MerchPad works reliably in venues with poor connectivity. Comprehensive undo/redo logic and detailed transaction history provide full accountability for cash-handling scenarios. Perfect for festivals, venues, or touring artists managing multiple SKUs across multiple shows.',
    features: ['Tally Counter interface', 'Stock visualization by color', 'Offline-first', 'Audit trail logging', 'Undo/redo']
  },
  {
    name: 'Quote',
    status: 'LIVE',
    logo: 'Document with quotation marks or Invoice',
    ctaText: 'Start Quoting',
    ctaUrl: 'https://quote.moshly.io',
    description: 'Quote (formerly FeeMe) is a streamlined artist fee estimation and proposal generator designed for promoters, festival organizers, and booking agents. Input artist details, event parameters, and fee benchmarks to generate professional PDF proposals in seconds. The app standardizes pricing logic while respecting regional market variations and artist tier classifications. Each quote is timestamped and version-controlled, enabling transparent negotiations with clear audit trails. The PDF output is production-ready, branded, and includes detailed line items for transparency. Quote eliminates manual spreadsheet work and ensures consistency across multiple booking conversations, saving hours per month for booking professionals and enabling faster, data-informed deal-making.',
    features: ['PDF proposal generation', 'Artist tier classification', 'Regional pricing variations', 'Version control']
  },
  {
    name: 'Rank',
    status: 'COMING SOON',
    logo: 'Bar chart, podium, or ranking',
    ctaText: 'Join Waitlist',
    ctaUrl: 'https://moshly.io/waitlist?app=rank',
    description: 'Rank is a competitive intelligence and pricing analytics dashboard for artists, managers, and booking professionals. Compare your fee positioning against peers, track market trends, analyze demand signals, and optimize pricing strategy. Rank aggregates anonymized data from the Moshly ecosystem (with full privacy compliance) to reveal what similar artists are charging, how their fee trajectories shift with career milestones, and which regions command premium rates. The dashboard includes forecasting models, regional heat maps, and seasonal trend analysis. Armed with data, artists can negotiate confidently, managers can justify rate increases to promoters, and booking agents can identify underpriced talent. Rank transforms fee-setting from guesswork into informed strategy.',
    features: ['Competitive pricing intelligence', 'Market trend tracking', 'Demand signal analysis', 'Forecasting models']
  },
  {
    name: 'Run',
    status: 'COMING SOON',
    logo: 'Roadmap, compass, or route',
    ctaText: 'Join Waitlist',
    ctaUrl: 'https://moshly.io/waitlist?app=run',
    description: 'Run is an interactive roadbook and logistical command center for touring professionals. Tour managers, crew leads, and equipment coordinators use Run to manage itineraries, venue details, travel times, load-in/load-out schedules, and real-time crew coordination across multi-day or multi-week tours. The app integrates GPS tracking, milestone notifications, and dynamic route optimization to keep everyone aligned. Each tour generates a living document that automatically updates as conditions change—weather delays, venue changes, crew arrivals. Mobile-first design ensures accessibility in the field, with offline access to critical data and push notifications for time-sensitive updates. Run becomes the single source of truth for tour logistics, replacing fragmented emails, spreadsheets, and group chat chaos.',
    features: ['Interactive roadbook', 'GPS tracking', 'Real-time crew coordination', 'Mobile-first', 'Offline access']
  }
];

const AppsPage: React.FC = () => {
  return (
    <div style={{
      backgroundColor: tokens.colors.bgPrimary,
      color: tokens.colors.textPrimary,
      fontFamily: tokens.typography.familyBase,
      minHeight: '100vh',
    }}>
      <style>{`
        :root {
          --color-bg-primary: ${tokens.colors.bgPrimary};
          --color-bg-secondary: ${tokens.colors.bgSecondary};
          --color-bg-surface: ${tokens.colors.bgSurface};
          --color-text-primary: ${tokens.colors.textPrimary};
          --color-text-secondary: ${tokens.colors.textSecondary};
          --color-accent-primary: ${tokens.colors.accentPrimary};
          --color-accent-hover: ${tokens.colors.accentHover};
          --color-success: ${tokens.colors.success};
          --color-border-subtle: ${tokens.colors.borderSubtle};
          --shadow-md: ${tokens.shadows.md};
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        .hero {
          border-top: 4px solid var(--color-accent-primary);
          padding: 80px 40px;
          text-align: left;
        }

        .hero-title {
          font-size: ${tokens.typography.sizeH1};
          font-weight: ${tokens.typography.weightBold};
          margin-bottom: ${tokens.spacing.md};
          line-height: 1.2;
        }

        .hero-subtitle {
          font-size: ${tokens.typography.sizeBase};
          color: var(--color-text-secondary);
          max-width: 800px;
        }

        .apps-grid-section {
          background-color: var(--color-bg-secondary);
          padding: 48px 0;
        }

        .apps-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding: 0 40px;
        }

        .app-card {
          background-color: var(--color-bg-surface);
          border: 1px solid var(--color-border-subtle);
          border-radius: ${tokens.radius.lg};
          padding: 48px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          box-shadow: var(--shadow-md);
        }

        .app-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .app-logo-placeholder {
          width: 64px;
          height: 64px;
          background-color: var(--color-bg-secondary);
          border-radius: ${tokens.radius.md};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          text-align: center;
          color: var(--color-text-tertiary);
          border: 1px dashed var(--color-border-subtle);
        }

        .app-title {
          font-size: ${tokens.typography.size2xl};
          font-weight: ${tokens.typography.weightBold};
          margin: 0;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: ${tokens.typography.weightSemibold};
          text-transform: uppercase;
        }

        .status-badge--live {
          background-color: var(--color-success);
          color: #1A1A1A;
        }

        .status-badge--soon {
          background-color: var(--color-accent-primary);
          color: #FFFFFF;
        }

        .screenshot-placeholder {
          width: 100%;
          max-width: 600px;
          height: 400px;
          border: 2px dashed var(--color-border-subtle);
          background-color: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-tertiary);
          border-radius: ${tokens.radius.md};
        }

        .app-description {
          font-size: ${tokens.typography.sizeBase};
          line-height: 1.5;
          color: var(--color-text-secondary);
          margin: 0;
        }

        .features-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .feature-tag {
          background-color: var(--color-bg-secondary);
          padding: 4px 12px;
          border-radius: ${tokens.radius.pill};
          font-size: ${tokens.typography.sizeSm};
          color: var(--color-text-primary);
        }

        .cta-button {
          display: inline-block;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: ${tokens.typography.weightSemibold};
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
          width: fit-content;
        }

        .cta-button--primary {
          background-color: var(--color-accent-primary);
          color: white;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0px 8px 24px rgba(255, 107, 44, 0.3);
        }

        @media (max-width: 1199px) {
          .hero, .apps-grid {
            padding-left: 24px;
            padding-right: 24px;
          }
          .app-card {
            padding: 32px;
          }
        }

        @media (max-width: 767px) {
          .hero, .apps-grid {
            padding-left: 16px;
            padding-right: 16px;
          }
          .app-card {
            padding: 24px;
          }
          .hero-title {
            font-size: 32px;
          }
          .screenshot-placeholder {
            height: 250px;
          }
          .app-header {
            flex-wrap: wrap;
          }
        }
      `}</style>

      <header className="hero">
        <div className="container">
          <h1 className="hero-title">Moshly Apps</h1>
          <p className="hero-subtitle">
            Focused tools built for the music industry. From music theory to tour logistics and market intelligence.
          </p>
        </div>
      </header>

      <main className="apps-grid-section">
        <div className="container apps-grid">
          {apps.map((app) => (
            <section key={app.name} className="app-card">
              <div className="app-header">
                <div className="app-logo-placeholder">
                  {app.name} Logo
                </div>
                <h2 className="app-title">{app.name}</h2>
                <span className={`status-badge ${app.status === 'LIVE' ? 'status-badge--live' : 'status-badge--soon'}`}>
                  {app.status}
                </span>
              </div>

              <div className="screenshot-placeholder">
                App Screenshot
              </div>

              <p className="app-description">{app.description}</p>

              <div className="features-tags">
                {app.features.map((feature) => (
                  <span key={feature} className="feature-tag">{feature}</span>
                ))}
              </div>

              <a href={app.ctaUrl} className="cta-button cta-button--primary">
                {app.ctaText}
              </a>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AppsPage;
