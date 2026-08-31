import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity,
    ArrowRight,
    BrainCircuit,
    Dumbbell,
    Flame,
    Sparkles,
    Star,
    Utensils,
    BarChart3,
    Check,
    CheckCircle2,
    Compass,
    Lock,
    Shield,
    Smartphone,
    TrendingUp,
    Trophy,
    Zap,
    Menu,
    X
} from 'lucide-react';
import './LandingPage.css';

// Key Value Pillars
const pillars = [
    {
        icon: Dumbbell,
        title: 'Plan with Precision',
        description: 'AI-generated routines built dynamically around your recovery, equipment, and strength goals.',
    },
    {
        icon: Utensils,
        title: 'Zero-Friction Nutrition',
        description: 'Log meals in seconds via natural language or photo scanner with automated macro synthesis.',
    },
    {
        icon: Activity,
        title: 'Live Muscle Heatmap',
        description: 'Interactive 3D biometrics showing targeted muscle groups, current fatigue, and readiness.',
    },
    {
        icon: BarChart3,
        title: 'Predictive Overload',
        description: 'Scientific 1RM and volume trajectory tracking that ensures consistent weekly progression.',
    },
];

// Step-by-step Process: How It Works & How It Helps
const processSteps = [
    {
        step: '01',
        tag: 'CALIBRATE',
        title: 'Set Your Profile & Biometrics',
        description: 'Define your primary goals (Hypertrophy, Strength, Cutting), available gym equipment, split frequency, and dietary preferences.',
        benefitLabel: 'HOW IT HELPS',
        benefitText: 'Eliminates generic cookie-cutter routines with an exact baseline tailored to your schedule and physiology.',
        icon: Compass,
    },
    {
        step: '02',
        tag: 'EXECUTE & LOG',
        title: 'Train with Zero-Friction Logging',
        description: 'Follow guided sets with smart autofill weights, integrated rest timers, voice/text food logging, and instant plate calculators.',
        benefitLabel: 'HOW IT HELPS',
        benefitText: 'Saves 15+ minutes per session vs traditional notes apps so your full focus remains on lifting intensity.',
        icon: Zap,
    },
    {
        step: '03',
        tag: 'SYNTHESIZE',
        title: 'Real-Time Recovery & AI Analysis',
        description: 'Every logged set recalculates your muscle fatigue heatmap, volume distribution, and estimated recovery window.',
        benefitLabel: 'HOW IT HELPS',
        benefitText: 'Prevents systemic overtraining and isolates lagging body parts with data-driven feedback.',
        icon: BrainCircuit,
    },
    {
        step: '04',
        tag: 'PROGRESS',
        title: 'Scale Strength & Hit Milestones',
        description: 'Receive weekly AI performance reports, level up your lifter rank on global leaderboards, and shatter personal records.',
        benefitLabel: 'HOW IT HELPS',
        benefitText: 'Enforces progressive overload science for reliable, unbroken weekly gains without plateaus.',
        icon: TrendingUp,
    },
];

// Testimonials
const testimonials = [
    {
        quote: "The 3D muscle recovery heatmap completely changed how I program my push/pull split. I haven't hit a plateau in 6 months.",
        name: "Marcus Vance",
        role: "Competitive Powerlifter",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        rating: 5,
        stat: "+45 lbs on Bench Press",
    },
    {
        quote: "Logging meals with natural language is a game changer. I just type '3 scrambled eggs with toast' and macros are recorded instantly.",
        name: "Elena Rostova",
        role: "Hyrox Competitor & Coach",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
        rating: 5,
        stat: "99.4% Macro Consistency",
    },
    {
        quote: "MuscleBot replaces three different fitness apps for me. AI Coach answers questions about my volume better than my old PT.",
        name: "David Chen",
        role: "Software Architect & Lifter",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        rating: 5,
        stat: "140+ Day Workout Streak",
    },
];

export default function LandingPage() {
    const navigate = useNavigate();
    const [billingCycle, setBillingCycle] = useState('annual'); // 'monthly' | 'annual'
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const navigateToAuth = (view) => navigate('/auth', { state: { view } });

    // Handle scroll for fixed navbar elevation
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="musclebot-landing">
            <a className="landing-skip-link" href="#landing-main">
                Skip to content
            </a>

            {/* FIXED GLASSMORPHIC NAVBAR */}
            <header className={`landing-header ${isScrolled ? 'landing-header--scrolled' : ''}`}>
                <nav className="landing-shell landing-nav" aria-label="Main navigation">
                    <a className="landing-brand" href="#landing-main" aria-label="MuscleBot home">
                        <img
                            src="/landing/brand-mark.webp"
                            width="38"
                            height="38"
                            alt="MuscleBot Logo"
                            decoding="async"
                        />
                        <span className="landing-brand-text">
                            Muscle<span className="landing-brand-accent">Bot</span>
                        </span>
                        <span className="landing-brand-badge">SaaS 2.0</span>
                    </a>

                    {/* Desktop Navigation Links */}
                    <div className="landing-nav-links">
                        <a href="#how-it-works">How It Works</a>
                        <a href="#features">Capabilities</a>
                        <a href="#analytics">Analytics</a>
                        <a href="#pricing">Pricing</a>
                        <a href="#faq">FAQ</a>
                    </div>

                    {/* Desktop Actions */}
                    <div className="landing-nav-actions">
                        <button
                            className="landing-text-button"
                            type="button"
                            onClick={() => navigateToAuth('login')}
                        >
                            Sign in
                        </button>
                        <button
                            className="landing-button landing-button--compact landing-button--glow"
                            type="button"
                            onClick={() => navigateToAuth('signup')}
                        >
                            <span>Get Started</span>
                            <ArrowRight size={15} strokeWidth={2.2} />
                        </button>
                    </div>

                    {/* Mobile Hamburger Toggle */}
                    <button
                        className="landing-mobile-menu-toggle"
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle navigation menu"
                        aria-expanded={mobileMenuOpen}
                    >
                        {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </nav>

                {/* Mobile Navigation Drawer */}
                {mobileMenuOpen && (
                    <div className="landing-mobile-drawer animate-fade-in">
                        <div className="landing-mobile-links">
                            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
                            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Capabilities</a>
                            <a href="#analytics" onClick={() => setMobileMenuOpen(false)}>Analytics</a>
                            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
                            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
                        </div>
                        <div className="landing-mobile-actions">
                            <button
                                className="landing-button landing-button--secondary w-full"
                                type="button"
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    navigateToAuth('login');
                                }}
                            >
                                Sign in
                            </button>
                            <button
                                className="landing-button landing-button--primary w-full"
                                type="button"
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    navigateToAuth('signup');
                                }}
                            >
                                Get Started Free
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </header>

            <main id="landing-main">
                {/* 1. HERO SECTION */}
                <section className="landing-hero" aria-labelledby="landing-title">
                    <div className="landing-shell landing-hero-grid">
                        <div className="landing-hero-copy">
                            <div className="landing-eyebrow-pill">
                                <Sparkles size={14} className="landing-eyebrow-spark" />
                                <span>AI-Guided Fitness Intelligence 2.0</span>
                                <span className="landing-pill-divider" />
                                <span className="landing-pill-highlight">Web & Mobile</span>
                            </div>

                            <h1 id="landing-title">
                                The Intelligent OS for <span>Your Fitness.</span>
                            </h1>

                            <p className="landing-hero-description">
                                MuscleBot unites adaptive AI workout generation, real-time muscle recovery heatmaps,
                                friction-free nutrition tracking, and predictive strength analytics into one cohesive platform.
                            </p>

                            <div className="landing-hero-actions">
                                <button
                                    className="landing-button landing-button--primary landing-button--large"
                                    type="button"
                                    onClick={() => navigateToAuth('signup')}
                                >
                                    <span>Start Free Trial</span>
                                    <ArrowRight aria-hidden="true" size={18} strokeWidth={2.2} />
                                </button>
                                <a className="landing-button landing-button--outline" href="#how-it-works">
                                    <span>See How It Works</span>
                                </a>
                            </div>

                            {/* Trust badges */}
                            <div className="landing-hero-trust">
                                <div className="landing-hero-stars">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />
                                    ))}
                                </div>
                                <span className="landing-trust-text">
                                    <strong>4.9/5</strong> rating from 10,000+ lifters & coaches · No credit card required
                                </span>
                            </div>
                        </div>

                        {/* Interactive Hero Visual Showcase */}
                        <div className="landing-hero-visual" aria-label="MuscleBot muscle activity insights preview">
                            <div className="landing-product-frame">
                                <div className="landing-frame-bar" aria-hidden="true">
                                    <span className="dot dot--red" />
                                    <span className="dot dot--yellow" />
                                    <span className="dot dot--green" />
                                    <span className="landing-frame-title">app.musclebot.ai / live-insights</span>
                                    <small className="landing-frame-status">
                                        <span className="live-indicator" /> RECOVERY: 94%
                                    </small>
                                </div>
                                
                                <div className="landing-frame-image-wrap">
                                    <img
                                        src="/landing/muscle-map-1280.webp"
                                        srcSet="/landing/muscle-map-640.webp 640w, /landing/muscle-map-1280.webp 1280w"
                                        sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1200px) 48vw, 590px"
                                        width="1280"
                                        height="1024"
                                        alt="MuscleBot showing interactive muscle activity maps"
                                        loading="eager"
                                        fetchPriority="high"
                                        decoding="async"
                                    />
                                    
                                    {/* Floating Telemetry Chips */}
                                    <div className="landing-floating-chip chip-top-right">
                                        <BrainCircuit size={16} className="text-blue-400" />
                                        <div>
                                            <p className="chip-label">AI Coach Adaptation</p>
                                            <p className="chip-value">+5% Chest Volume Recommended</p>
                                        </div>
                                    </div>

                                    <div className="landing-floating-chip chip-bottom-left">
                                        <Flame size={16} className="text-amber-400" />
                                        <div>
                                            <p className="chip-label">Nutrition Balance</p>
                                            <p className="chip-value">180g Protein Target Hit</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. STATS & PROOF RIBBON */}
                <section className="landing-stats-ribbon" aria-label="MuscleBot performance statistics">
                    <div className="landing-shell">
                        <div className="landing-stats-grid">
                            <div className="landing-stat-item">
                                <h3 className="landing-stat-value">500K+</h3>
                                <p className="landing-stat-label">Workouts & Sets Logged</p>
                            </div>
                            <div className="landing-stat-divider" />
                            <div className="landing-stat-item">
                                <h3 className="landing-stat-value">99.4%</h3>
                                <p className="landing-stat-label">AI Macro Accuracy</p>
                            </div>
                            <div className="landing-stat-divider" />
                            <div className="landing-stat-item">
                                <h3 className="landing-stat-value">4.9 / 5.0</h3>
                                <p className="landing-stat-label">App Store & Web Rating</p>
                            </div>
                            <div className="landing-stat-divider" />
                            <div className="landing-stat-item">
                                <h3 className="landing-stat-value">3.2x</h3>
                                <p className="landing-stat-label">Faster Strength Progression</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. PROCESS SECTION: HOW IT WORKS & HOW IT HELPS */}
                <section className="landing-process-section" id="how-it-works" aria-labelledby="process-title">
                    <div className="landing-shell">
                        <div className="landing-section-heading landing-section-heading--centered">
                            <p className="landing-section-label">THE 4-STEP TRANSFORMATION</p>
                            <h2 id="process-title">How It Works & How It Accelerates Your Gains</h2>
                            <p className="landing-section-subtitle">
                                Moving from guesswork to scientific progression shouldn't require five different apps. 
                                Here is how MuscleBot streamlines your entire training lifestyle.
                            </p>
                        </div>

                        <div className="landing-process-grid">
                            {processSteps.map((step) => (
                                <div className="landing-process-card" key={step.step}>
                                    <div className="landing-process-header">
                                        <span className="landing-process-number">{step.step}</span>
                                        <span className="landing-process-tag">{step.tag}</span>
                                        <span className="landing-process-icon">
                                            {React.createElement(step.icon, { size: 20 })}
                                        </span>
                                    </div>
                                    <h3 className="landing-process-title">{step.title}</h3>
                                    <p className="landing-process-desc">{step.description}</p>
                                    
                                    <div className="landing-process-benefit">
                                        <span className="benefit-badge">
                                            <CheckCircle2 size={13} className="text-emerald-400" />
                                            {step.benefitLabel}
                                        </span>
                                        <p>{step.benefitText}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 4. PILLARS / CORE VALUE OVERVIEW */}
                <section className="landing-pillars" aria-label="Core fitness pillars">
                    <div className="landing-shell landing-pillar-grid">
                        {pillars.map(({ icon, title, description }) => (
                            <article className="landing-pillar" key={title}>
                                <span className="landing-pillar-icon" aria-hidden="true">
                                    {React.createElement(icon, { size: 20, strokeWidth: 1.8 })}
                                </span>
                                <div>
                                    <h3>{title}</h3>
                                    <p>{description}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                {/* 5. BENTO GRID FEATURES SHOWCASE */}
                <section className="landing-product" id="features" aria-labelledby="product-title">
                    <div className="landing-shell">
                        <div className="landing-section-heading">
                            <div>
                                <p className="landing-section-label">UNIFIED CAPABILITIES</p>
                                <h2 id="product-title">Engineered for Lifters Who Demand Results.</h2>
                            </div>
                            <p className="landing-section-lead">
                                Every tool in MuscleBot connects with the rest of the ecosystem. Your training informs your nutrition, and your nutrition informs your recovery.
                            </p>
                        </div>

                        {/* Bento Row 1: AI Coach & Nutrition */}
                        <div className="landing-feature-grid">
                            <article className="landing-feature-card landing-feature-card--coach">
                                <div className="landing-feature-copy">
                                    <div className="landing-feature-badge-row">
                                        <span className="landing-feature-icon" aria-hidden="true">
                                            <BrainCircuit size={20} strokeWidth={1.8} />
                                        </span>
                                        <span className="landing-feature-badge">ADAPTIVE INTELLIGENCE</span>
                                    </div>
                                    <p className="landing-feature-label">AI Coach & Routine Builder</p>
                                    <h3>A personal coach grounded in your real lifting history.</h3>
                                    <p>
                                        Ask questions about your logged volume, request instant routine modifications when equipment is occupied, and receive weekly AI progress audits that highlight undertrained muscles.
                                    </p>
                                    <ul className="landing-feature-bullets">
                                        <li><Check size={14} /> Smart split generator for 3, 4, 5, or 6-day weeks</li>
                                        <li><Check size={14} /> Injury avoidance & joint-friendly swaps</li>
                                        <li><Check size={14} /> Real-time fatigue & RPE calibration</li>
                                    </ul>
                                </div>
                                <div className="landing-feature-image">
                                    <img
                                        src="/landing/ai-coach-1120.webp"
                                        srcSet="/landing/ai-coach-640.webp 640w, /landing/ai-coach-1120.webp 1120w"
                                        sizes="(max-width: 767px) calc(100vw - 64px), (max-width: 1200px) 56vw, 680px"
                                        width="1120"
                                        height="896"
                                        alt="MuscleBot AI Coach chat and reports screens"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </div>
                            </article>

                            <article className="landing-feature-card landing-feature-card--nutrition">
                                <div className="landing-feature-copy">
                                    <div className="landing-feature-badge-row">
                                        <span className="landing-feature-icon" aria-hidden="true">
                                            <Utensils size={20} strokeWidth={1.8} />
                                        </span>
                                        <span className="landing-feature-badge">MACRO SYNTHESIS</span>
                                    </div>
                                    <p className="landing-feature-label">Smart Nutrition Log</p>
                                    <h3>Log meals the natural way you speak and eat.</h3>
                                    <p>
                                        Describe what you ate in natural language or capture meals quickly. MuscleBot balances your caloric budget, protein targets, and meal timing around your workouts.
                                    </p>
                                    <ul className="landing-feature-bullets">
                                        <li><Check size={14} /> Natural language instant parser</li>
                                        <li><Check size={14} /> Dynamic macro adjustment based on daily training</li>
                                        <li><Check size={14} /> Meal planner tailored to your budget & diet</li>
                                    </ul>
                                </div>
                                <div className="landing-feature-image">
                                    <img
                                        src="/landing/nutrition-1120.webp"
                                        srcSet="/landing/nutrition-640.webp 640w, /landing/nutrition-1120.webp 1120w"
                                        sizes="(max-width: 767px) calc(100vw - 64px), (max-width: 1200px) 38vw, 450px"
                                        width="1120"
                                        height="896"
                                        alt="MuscleBot nutrition tracking and meal planning screens"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </div>
                            </article>
                        </div>

                        {/* Bento Row 2: Deep Analytics Full Card */}
                        <article className="landing-progress-card" id="analytics">
                            <div className="landing-progress-copy">
                                <div className="landing-feature-badge-row">
                                    <span className="landing-feature-icon" aria-hidden="true">
                                        <Activity size={20} strokeWidth={1.8} />
                                    </span>
                                    <span className="landing-feature-badge">PROGRESS VISUALIZATION</span>
                                </div>
                                <p className="landing-feature-label">Performance Analytics</p>
                                <h3>Data you can understand in 5 seconds.</h3>
                                <p>
                                    Follow tonnage volume curves, 1RM estimated trajectory, body composition trends, and recovery cycles. Stop wondering if your program is working—let the numbers prove it.
                                </p>
                                <div className="landing-tags-grid">
                                    <span className="landing-tag-pill">Volume Tonnage (kg/lbs)</span>
                                    <span className="landing-tag-pill">Estimated 1RM Trends</span>
                                    <span className="landing-tag-pill">3D Muscle Activation Heatmap</span>
                                    <span className="landing-tag-pill">Body Weight & Macro Overlays</span>
                                    <span className="landing-tag-pill">Lifter XP & Global Rankings</span>
                                </div>
                            </div>
                            <div className="landing-progress-image">
                                <img
                                    src="/landing/progress-720.webp"
                                    srcSet="/landing/progress-420.webp 420w, /landing/progress-720.webp 720w"
                                    sizes="(max-width: 767px) calc(100vw - 64px), 410px"
                                    width="720"
                                    height="1280"
                                    alt="MuscleBot weight and training volume charts"
                                    loading="lazy"
                                    decoding="async"
                                />
                            </div>
                        </article>

                        {/* Bento Mini Row: Extra High-Value Highlights */}
                        <div className="landing-mini-grid">
                            <div className="landing-mini-card">
                                <div className="mini-card-icon"><Smartphone size={20} /></div>
                                <h4>Offline First & Sync</h4>
                                <p>Train anywhere with zero signal. Logs persist locally and synchronize automatically once reconnected.</p>
                            </div>
                            <div className="landing-mini-card">
                                <div className="mini-card-icon"><Trophy size={20} /></div>
                                <h4>Gamified Streaks & Ranks</h4>
                                <p>Earn lifter XP, climb regional leaderboards, and maintain daily discipline with achievement badges.</p>
                            </div>
                            <div className="landing-mini-card">
                                <div className="mini-card-icon"><Lock size={20} /></div>
                                <h4>Privacy & Data Ownership</h4>
                                <p>Your biometric and training records are encrypted and exportable anytime in standard CSV formats.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 6. SOCIAL PROOF & TESTIMONIALS */}
                <section className="landing-testimonials-section" aria-labelledby="testimonials-title">
                    <div className="landing-shell">
                        <div className="landing-section-heading landing-section-heading--centered">
                            <p className="landing-section-label">COMMUNITY PROOF</p>
                            <h2 id="testimonials-title">Loved by Athletes, Lifters, and Coaches</h2>
                            <p className="landing-section-subtitle">
                                Read why dedicated lifters switched to MuscleBot as their primary fitness operating system.
                            </p>
                        </div>

                        <div className="landing-testimonials-grid">
                            {testimonials.map((t) => (
                                <div className="landing-testimonial-card" key={t.name}>
                                    <div className="testimonial-stars">
                                        {[...Array(t.rating)].map((_, i) => (
                                            <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
                                        ))}
                                    </div>
                                    <p className="testimonial-quote">"{t.quote}"</p>
                                    
                                    <div className="testimonial-footer">
                                        <img className="testimonial-avatar" src={t.avatar} alt={t.name} width="44" height="44" />
                                        <div>
                                            <h4 className="testimonial-name">{t.name}</h4>
                                            <p className="testimonial-role">{t.role}</p>
                                        </div>
                                    </div>
                                    <div className="testimonial-stat-badge">
                                        <Zap size={12} />
                                        <span>{t.stat}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 7. PRICING SECTION */}
                <section className="landing-pricing-section" id="pricing" aria-labelledby="pricing-title">
                    <div className="landing-shell">
                        <div className="landing-section-heading landing-section-heading--centered">
                            <p className="landing-section-label">SIMPLE, TRANSPARENT PRICING</p>
                            <h2 id="pricing-title">Invest in Your Health with Zero Risk</h2>
                            <p className="landing-section-subtitle">
                                Start free forever, or unlock full AI coaching, 3D recovery heatmaps, and advanced volume analytics.
                            </p>

                            {/* Billing Switcher */}
                            <div className="landing-billing-switcher" role="radiogroup" aria-label="Billing frequency">
                                <button
                                    className={`billing-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                                    type="button"
                                    onClick={() => setBillingCycle('monthly')}
                                >
                                    Monthly
                                </button>
                                <button
                                    className={`billing-toggle-btn ${billingCycle === 'annual' ? 'active' : ''}`}
                                    type="button"
                                    onClick={() => setBillingCycle('annual')}
                                >
                                    <span>Annual</span>
                                    <span className="annual-save-badge">Save 40%</span>
                                </button>
                            </div>
                        </div>

                        {/* Pricing Cards Grid */}
                        <div className="landing-pricing-grid">
                            {/* Tier 1: Starter */}
                            <div className="landing-pricing-card">
                                <div className="pricing-card-header">
                                    <h3 className="pricing-tier-name">Starter Free</h3>
                                    <p className="pricing-tier-desc">Essential workout & nutrition tracking for everyday lifters.</p>
                                </div>
                                <div className="pricing-price-wrap">
                                    <span className="pricing-currency">$</span>
                                    <span className="pricing-amount">0</span>
                                    <span className="pricing-period">/ forever</span>
                                </div>
                                <button
                                    className="landing-button landing-button--outline w-full"
                                    type="button"
                                    onClick={() => navigateToAuth('signup')}
                                >
                                    Get Started Free
                                </button>
                                <div className="pricing-features-list">
                                    <p className="pricing-features-header">Included in Starter:</p>
                                    <ul>
                                        <li><Check size={16} className="text-blue-400" /> Core workout logger & rest timer</li>
                                        <li><Check size={16} className="text-blue-400" /> Basic nutrition & daily calorie log</li>
                                        <li><Check size={16} className="text-blue-400" /> 2D muscle target map</li>
                                        <li><Check size={16} className="text-blue-400" /> Body weight tracking chart</li>
                                        <li><Check size={16} className="text-blue-400" /> Offline logging support</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Tier 2: Pro Athlete (Featured) */}
                            <div className="landing-pricing-card landing-pricing-card--popular">
                                <div className="popular-badge">
                                    <Sparkles size={13} />
                                    MOST POPULAR
                                </div>
                                <div className="pricing-card-header">
                                    <h3 className="pricing-tier-name">Pro Athlete</h3>
                                    <p className="pricing-tier-desc">The complete AI coaching, recovery, and hypertrophy engine.</p>
                                </div>
                                <div className="pricing-price-wrap">
                                    <span className="pricing-currency">$</span>
                                    <span className="pricing-amount">{billingCycle === 'annual' ? '5.99' : '9.99'}</span>
                                    <span className="pricing-period">/ month</span>
                                </div>
                                <p className="pricing-billing-subtext">
                                    {billingCycle === 'annual' ? 'Billed annually ($71.88/yr) · 7-day free trial' : 'Billed monthly · Cancel anytime'}
                                </p>
                                <button
                                    className="landing-button landing-button--primary landing-button--glow w-full"
                                    type="button"
                                    onClick={() => navigateToAuth('signup')}
                                >
                                    <span>Start 7-Day Free Trial</span>
                                    <ArrowRight size={16} />
                                </button>
                                <div className="pricing-features-list">
                                    <p className="pricing-features-header">Everything in Starter, plus:</p>
                                    <ul>
                                        <li><Check size={16} className="text-emerald-400" /> <strong>Unlimited AI Coach Chat</strong> & Routine Generator</li>
                                        <li><Check size={16} className="text-emerald-400" /> <strong>3D Interactive Muscle Heatmaps</strong> & Readiness</li>
                                        <li><Check size={16} className="text-emerald-400" /> <strong>Smart AI Meal Planner</strong> & Macro Scanner</li>
                                        <li><Check size={16} className="text-emerald-400" /> <strong>Advanced Volume & 1RM</strong> Trajectory Analytics</li>
                                        <li><Check size={16} className="text-emerald-400" /> Global Leaderboards, Streaks & XP Ranks</li>
                                        <li><Check size={16} className="text-emerald-400" /> Cloud Sync & Unlimited History Backup</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Tier 3: Lifetime Elite */}
                            <div className="landing-pricing-card">
                                <div className="pricing-card-header">
                                    <h3 className="pricing-tier-name">Lifetime Elite</h3>
                                    <p className="pricing-tier-desc">Permanent access for dedicated athletes and trainers.</p>
                                </div>
                                <div className="pricing-price-wrap">
                                    <span className="pricing-currency">$</span>
                                    <span className="pricing-amount">99</span>
                                    <span className="pricing-period">/ one-time</span>
                                </div>
                                <p className="pricing-billing-subtext">Pay once, own MuscleBot Pro forever</p>
                                <button
                                    className="landing-button landing-button--outline w-full"
                                    type="button"
                                    onClick={() => navigateToAuth('signup')}
                                >
                                    Get Lifetime Access
                                </button>
                                <div className="pricing-features-list">
                                    <p className="pricing-features-header">Everything in Pro, plus:</p>
                                    <ul>
                                        <li><Check size={16} className="text-purple-400" /> <strong>Lifetime Pro Membership</strong> (Zero recurring fees)</li>
                                        <li><Check size={16} className="text-purple-400" /> All future AI engine updates included</li>
                                        <li><Check size={16} className="text-purple-400" /> VIP Discord Athlete badge & direct feedback</li>
                                        <li><Check size={16} className="text-purple-400" /> Early beta access to new biometrics features</li>
                                        <li><Check size={16} className="text-purple-400" /> Priority cloud sync speed</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Micro-guarantee banner */}
                        <div className="landing-pricing-guarantee">
                            <Shield size={18} className="text-blue-400" />
                            <span>
                                <strong>Risk-Free Guarantee:</strong> 7-day free trial on Pro. Cancel anytime with a single click in your settings.
                            </span>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
