import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity,
    ArrowRight,
    BrainCircuit,
    Dumbbell,
    Flame,
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
    X,
    ChevronDown,
    Globe
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

// Extended Community Proof / Testimonials for Marquee Track
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
    {
        quote: "The automated 1RM calculation and recovery readiness scores keep my athletes peaking on meet day without injury.",
        name: "Coach Tariq Malik",
        role: "Strength & Conditioning Coach",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        rating: 5,
        stat: "12 Athletes Trained",
    },
    {
        quote: "As a busy doctor, I don't have hours to plan workouts. MuscleBot generates the exact 45-min session I need based on today's fatigue.",
        name: "Dr. Sarah Jenkins",
        role: "Emergency Physician",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
        rating: 5,
        stat: "4x Workouts / Week",
    },
    {
        quote: "The offline gym logging is flawless. I train in a basement garage with no cellular service and everything syncs when I get home.",
        name: "Zayn Ahmed",
        role: "Natural Bodybuilder",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
        rating: 5,
        stat: "-8% Body Fat in 12 Wks",
    },
];

// Country & Currency Localization Configuration
const COUNTRY_PRICING = {
    PK: { code: 'PK', name: 'Pakistan', currency: 'Rs', monthly: '400', yearly: '3,200', note: 'PKR billing' },
    IN: { code: 'IN', name: 'India', currency: '₹', monthly: '499', yearly: '3,999', note: 'INR billing' },
    US: { code: 'US', name: 'United States', currency: '$', monthly: '4.99', yearly: '39.99', note: 'USD billing' },
    GB: { code: 'GB', name: 'United Kingdom', currency: '£', monthly: '4.49', yearly: '35.99', note: 'GBP billing' },
    EU: { code: 'EU', name: 'Europe', currency: '€', monthly: '4.99', yearly: '39.99', note: 'EUR billing' },
    AE: { code: 'AE', name: 'UAE', currency: 'AED', monthly: '19', yearly: '149', note: 'AED billing' },
    SA: { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', monthly: '19', yearly: '149', note: 'SAR billing' },
    DEFAULT: { code: 'PK', name: 'Pakistan (Default)', currency: 'Rs', monthly: '400', yearly: '3,200', note: 'Local pricing' },
};

// FAQ Items
const faqs = [
    {
        question: "How do the free monthly AI credits work?",
        answer: "Every free user gets 10 AI generation and analysis credits each month that automatically refresh on the 1st of every month. You can use these for AI coach questions, meal scanning, and custom workout creation."
    },
    {
        question: "How does the AI Coach tailor workouts to my recovery?",
        answer: "MuscleBot computes muscle fatigue coefficients after every set you log. When creating or adapting your routines, the AI analyzes which muscle groups have fully recovered vs which need rest, adjusting volume, exercise selection, and rep ranges accordingly."
    },
    {
        question: "Can I log my workouts and food while offline in the gym?",
        answer: "Yes! MuscleBot is built with full offline caching and local persistence. You can record sets, reps, and nutrition in basement gyms with zero cellular signal. Everything synchronizes automatically once your device reconnects."
    },
    {
        question: "How does natural language nutrition logging work?",
        answer: "Instead of searching endless generic food databases, simply type or speak your meal (e.g., '200g grilled chicken breast with 1 cup jasmine rice and avocado'). Our AI parser accurately breaks down calories, protein, carbs, and fats immediately."
    },
    {
        question: "Can I switch or cancel my plan at any time?",
        answer: "Absolutely. There are no lock-in contracts or cancellation penalties. You can easily upgrade, downgrade, or cancel your subscription at any time directly through your profile settings or mobile app store."
    },
    {
        question: "Does MuscleBot sync across mobile and web?",
        answer: "Yes, your profile, workout logs, nutrition history, and custom routines are securely stored in the cloud and synced in real-time across iOS, Android, and Web browsers."
    },
];

export default function LandingPage() {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    
    // IP-based Location & Pricing State
    const [selectedCountry, setSelectedCountry] = useState('PK');
    const [pricing, setPricing] = useState(COUNTRY_PRICING.PK);
    const [isDetectingLocation, setIsDetectingLocation] = useState(true);

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

    // Detect User Country via IP with TimeZone Fallback
    useEffect(() => {
        let isMounted = true;

        async function detectUserCountry() {
            try {
                // Try fast IP geolocation API
                const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
                if (res.ok) {
                    const data = await res.json();
                    const countryCode = data.country_code?.toUpperCase();
                    if (countryCode && COUNTRY_PRICING[countryCode] && isMounted) {
                        setSelectedCountry(countryCode);
                        setPricing(COUNTRY_PRICING[countryCode]);
                        setIsDetectingLocation(false);
                        return;
                    }
                }
            } catch {
                // Fallback to client timezone
                try {
                    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
                    if (tz.includes('Karachi') || tz.includes('Pakistan')) {
                        setSelectedCountry('PK');
                        setPricing(COUNTRY_PRICING.PK);
                    } else if (tz.includes('Calcutta') || tz.includes('Kolkata') || tz.includes('India')) {
                        setSelectedCountry('IN');
                        setPricing(COUNTRY_PRICING.IN);
                    } else if (tz.includes('London')) {
                        setSelectedCountry('GB');
                        setPricing(COUNTRY_PRICING.GB);
                    } else if (tz.includes('Europe') || tz.includes('Berlin') || tz.includes('Paris')) {
                        setSelectedCountry('EU');
                        setPricing(COUNTRY_PRICING.EU);
                    } else if (tz.includes('New_York') || tz.includes('America') || tz.includes('Los_Angeles')) {
                        setSelectedCountry('US');
                        setPricing(COUNTRY_PRICING.US);
                    } else {
                        setSelectedCountry('PK');
                        setPricing(COUNTRY_PRICING.DEFAULT);
                    }
                } catch {
                    setSelectedCountry('PK');
                    setPricing(COUNTRY_PRICING.DEFAULT);
                }
            } finally {
                if (isMounted) setIsDetectingLocation(false);
            }
        }

        detectUserCountry();
        return () => { isMounted = false; };
    }, []);

    const handleCountryChange = (countryKey) => {
        setSelectedCountry(countryKey);
        setPricing(COUNTRY_PRICING[countryKey] || COUNTRY_PRICING.DEFAULT);
    };

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? -1 : index);
    };

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

                            {/* Trust Rating Block */}
                            <div className="landing-hero-trust">
                                <div className="landing-hero-stars">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />
                                    ))}
                                </div>
                                <span className="landing-trust-text">
                                    <span className="trust-number-highlight">4.9 / 5.0</span> score from <strong>10,000+</strong> active lifters & trainers
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
                                <h3 className="landing-stat-value">500,000+</h3>
                                <p className="landing-stat-label">Workouts & Sets Logged</p>
                            </div>
                            <div className="landing-stat-divider" />
                            <div className="landing-stat-item">
                                <h3 className="landing-stat-value">99.4%</h3>
                                <p className="landing-stat-label">AI Macro Accuracy</p>
                            </div>
                            <div className="landing-stat-divider" />
                            <div className="landing-stat-item">
                                <h3 className="landing-stat-value">4.9 / 5</h3>
                                <p className="landing-stat-label">App Rating by Athletes</p>
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
                                        <div className="landing-process-step-badge">
                                            <span className="landing-process-number">{step.step}</span>
                                        </div>
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

                {/* 5. BENTO GRID FEATURES SHOWCASE (CENTERED UNIFORM HEADING) */}
                <section className="landing-product" id="features" aria-labelledby="product-title">
                    <div className="landing-shell">
                        <div className="landing-section-heading landing-section-heading--centered">
                            <p className="landing-section-label">UNIFIED CAPABILITIES</p>
                            <h2 id="product-title">Engineered for Lifters Who Demand Results</h2>
                            <p className="landing-section-subtitle">
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

                {/* 6. SOCIAL PROOF & TESTIMONIALS (ANIMATED MARQUEE CARDS) */}
                <section className="landing-testimonials-section" aria-labelledby="testimonials-title">
                    <div className="landing-shell">
                        <div className="landing-section-heading landing-section-heading--centered">
                            <p className="landing-section-label">COMMUNITY PROOF</p>
                            <h2 id="testimonials-title">Loved by Athletes, Lifters, and Coaches</h2>
                            <p className="landing-section-subtitle">
                                Read why thousands of dedicated athletes made MuscleBot their daily training OS.
                            </p>
                        </div>
                    </div>

                    {/* Infinite Moving Marquee Track */}
                    <div className="testimonials-marquee-container">
                        <div className="testimonials-marquee-track">
                            {[...testimonials, ...testimonials].map((t, idx) => (
                                <div className="landing-testimonial-card" key={`${t.name}-${idx}`}>
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

                {/* 7. PRICING SECTION (MATCHING APP: FREE, PRO MONTHLY, PRO YEARLY) */}
                <section className="landing-pricing-section" id="pricing" aria-labelledby="pricing-title">
                    <div className="landing-shell">
                        <div className="landing-section-heading landing-section-heading--centered">
                            <p className="landing-section-label">SIMPLE, TRANSPARENT PRICING</p>
                            <h2 id="pricing-title">Unlock MuscleBot Pro</h2>
                            <p className="landing-section-subtitle">
                                Get AI-powered coaching, advanced analytics, and unlimited workouts.
                            </p>

                            {/* Location / Currency Badge & Selector */}
                            <div className="landing-currency-selector-wrap">
                                <div className="landing-location-badge">
                                    <Globe size={14} className="text-blue-400" />
                                    <span>
                                        {isDetectingLocation ? 'Detecting local currency...' : `Pricing for ${pricing.name}`}
                                    </span>
                                </div>
                                <div className="landing-country-picker">
                                    <select
                                        value={selectedCountry}
                                        onChange={(e) => handleCountryChange(e.target.value)}
                                        aria-label="Select Country Currency"
                                        className="landing-country-select"
                                    >
                                        <option value="PK">🇵🇰 Pakistan (PKR - Rs 400)</option>
                                        <option value="IN">🇮🇳 India (INR - ₹499)</option>
                                        <option value="US">🇺🇸 United States (USD - $4.99)</option>
                                        <option value="GB">🇬🇧 United Kingdom (GBP - £4.49)</option>
                                        <option value="EU">🇪🇺 Europe (EUR - €4.99)</option>
                                        <option value="AE">🇦🇪 UAE (AED - 19 AED)</option>
                                        <option value="SA">🇸🇦 Saudi Arabia (SAR - 19 SAR)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Pricing Cards Grid - 3 Plans */}
                        <div className="landing-pricing-grid">
                            {/* Plan 1: Free Starter */}
                            <div className="landing-pricing-card">
                                <div className="pricing-card-header">
                                    <h3 className="pricing-tier-name">Free Starter</h3>
                                    <p className="pricing-tier-desc">Essential workout & macro tracking for everyday lifters.</p>
                                </div>
                                <div className="pricing-price-wrap">
                                    <span className="pricing-currency">{pricing.currency}</span>
                                    <span className="pricing-amount">0</span>
                                    <span className="pricing-period">/ month</span>
                                </div>
                                <p className="pricing-billing-subtext">Free forever · 10 AI credits refresh monthly</p>
                                <button
                                    className="landing-button landing-button--outline w-full"
                                    type="button"
                                    onClick={() => navigateToAuth('signup')}
                                >
                                    Get Started Free
                                </button>
                                <div className="pricing-features-list">
                                    <p className="pricing-features-header">Included in Free:</p>
                                    <ul>
                                        <li><Check size={16} className="text-blue-400" /> <strong>10 Free AI Credits / Month</strong> (Refreshes monthly)</li>
                                        <li><Check size={16} className="text-blue-400" /> Core workout logger & rest timer</li>
                                        <li><Check size={16} className="text-blue-400" /> Basic nutrition & daily calorie log</li>
                                        <li><Check size={16} className="text-blue-400" /> 2D muscle target map</li>
                                        <li><Check size={16} className="text-blue-400" /> Body weight tracking chart</li>
                                        <li><Check size={16} className="text-blue-400" /> Offline logging support</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Plan 2: MuscleBot Pro Monthly (From App) */}
                            <div className="landing-pricing-card">
                                <div className="pricing-card-header">
                                    <h3 className="pricing-tier-name">MuscleBot Pro Monthly</h3>
                                    <p className="pricing-tier-desc">Full AI-guided training intelligence billed monthly.</p>
                                </div>
                                <div className="pricing-price-wrap">
                                    <span className="pricing-currency">{pricing.currency}</span>
                                    <span className="pricing-amount">{pricing.monthly}</span>
                                    <span className="pricing-period">/ month</span>
                                </div>
                                <p className="pricing-billing-subtext">Billed monthly · Cancel anytime</p>
                                <button
                                    className="landing-button landing-button--secondary w-full"
                                    type="button"
                                    onClick={() => navigateToAuth('signup')}
                                >
                                    <span>Subscribe for {pricing.currency} {pricing.monthly}</span>
                                    <ArrowRight size={15} />
                                </button>
                                <div className="pricing-features-list">
                                    <p className="pricing-features-header">Pro Monthly Features:</p>
                                    <ul>
                                        <li><Check size={16} className="text-emerald-400" /> <strong>Unlimited personalized AI coach chat</strong></li>
                                        <li><Check size={16} className="text-emerald-400" /> <strong>AI meal planner & macro scanner</strong></li>
                                        <li><Check size={16} className="text-emerald-400" /> <strong>Advanced readiness & recovery analytics</strong></li>
                                        <li><Check size={16} className="text-emerald-400" /> <strong>Weekly & monthly progress reports</strong></li>
                                        <li><Check size={16} className="text-emerald-400" /> 3D interactive muscle heatmaps</li>
                                        <li><Check size={16} className="text-emerald-400" /> Global leaderboards & priority cloud sync</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Plan 3: MuscleBot Pro Yearly (BEST VALUE - From App) */}
                            <div className="landing-pricing-card landing-pricing-card--popular">
                                <div className="popular-badge">
                                    BEST VALUE
                                </div>
                                <div className="pricing-card-header">
                                    <h3 className="pricing-tier-name">MuscleBot Pro Yearly</h3>
                                    <p className="pricing-tier-desc">The most popular choice for committed athletes.</p>
                                </div>
                                <div className="pricing-price-wrap">
                                    <span className="pricing-currency">{pricing.currency}</span>
                                    <span className="pricing-amount">{pricing.yearly}</span>
                                    <span className="pricing-period">/ year</span>
                                </div>
                                <p className="pricing-billing-subtext">
                                    Save ~33% vs monthly billing · Cancel anytime
                                </p>
                                <button
                                    className="landing-button landing-button--primary landing-button--glow w-full"
                                    type="button"
                                    onClick={() => navigateToAuth('signup')}
                                >
                                    <span>Subscribe for {pricing.currency} {pricing.yearly}</span>
                                    <ArrowRight size={16} />
                                </button>
                                <div className="pricing-features-list">
                                    <p className="pricing-features-header">Everything in Pro, plus:</p>
                                    <ul>
                                        <li><Check size={16} className="text-emerald-400" /> <strong>Best Value (~33% Savings)</strong></li>
                                        <li><Check size={16} className="text-emerald-400" /> <strong>Unlimited personalized AI coach chat</strong></li>
                                        <li><Check size={16} className="text-emerald-400" /> <strong>AI meal planner & macro scanner</strong></li>
                                        <li><Check size={16} className="text-emerald-400" /> <strong>Advanced readiness & recovery analytics</strong></li>
                                        <li><Check size={16} className="text-emerald-400" /> <strong>Weekly & monthly progress reports</strong></li>
                                        <li><Check size={16} className="text-emerald-400" /> Priority cloud sync & unlimited workout history</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Micro-guarantee banner */}
                        <div className="landing-pricing-guarantee">
                            <Shield size={18} className="text-blue-400" />
                            <span>
                                <strong>Secure Billing:</strong> Synced seamlessly between Mobile App and Web. Cancel anytime with a single click in your settings.
                            </span>
                        </div>
                    </div>
                </section>

                {/* 8. FREQUENTLY ASKED QUESTIONS (FAQ) */}
                <section className="landing-faq-section" id="faq" aria-labelledby="faq-title">
                    <div className="landing-shell">
                        <div className="landing-section-heading landing-section-heading--centered">
                            <p className="landing-section-label">GOT QUESTIONS?</p>
                            <h2 id="faq-title">Frequently Asked Questions</h2>
                            <p className="landing-section-subtitle">
                                Everything you need to know about the product, billing, and AI capabilities.
                            </p>
                        </div>

                        <div className="landing-faq-accordion">
                            {faqs.map((faq, index) => {
                                const isOpen = openFaq === index;
                                return (
                                    <div
                                        key={faq.question}
                                        className={`landing-faq-item ${isOpen ? 'active' : ''}`}
                                    >
                                        <button
                                            className="landing-faq-trigger"
                                            type="button"
                                            onClick={() => toggleFaq(index)}
                                            aria-expanded={isOpen}
                                        >
                                            <span>{faq.question}</span>
                                            <ChevronDown
                                                size={18}
                                                className={`faq-chevron ${isOpen ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                        {isOpen && (
                                            <div className="landing-faq-content">
                                                <p>{faq.answer}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* 9. FINAL HIGH-CONVERSION CTA (CLEAN - NO TOP AI ICON) */}
                <section className="landing-final-section" aria-labelledby="final-cta-title">
                    <div className="landing-shell">
                        <div className="landing-final-card">
                            <div className="landing-final-card-glow" />
                            <p className="landing-section-label">START YOUR TRANSFORMATION</p>
                            <h2 id="final-cta-title">Make Every Single Session Count.</h2>
                            <p>
                                Join thousands of lifters who replaced spreadsheet chaos and guesswork with AI training intelligence.
                            </p>
                            <div className="landing-final-actions">
                                <button
                                    className="landing-button landing-button--light landing-button--large"
                                    type="button"
                                    onClick={() => navigateToAuth('signup')}
                                >
                                    <span>Create Your Account Free</span>
                                    <ArrowRight aria-hidden="true" size={18} strokeWidth={2.2} />
                                </button>
                                <button
                                    className="landing-final-signin"
                                    type="button"
                                    onClick={() => navigateToAuth('login')}
                                >
                                    Sign In to Existing Account
                                </button>
                            </div>
                            <p className="landing-final-microtext">
                                Free 10 AI credits monthly · Instant access on Web, iOS & Android
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            {/* 10. MULTI-COLUMN SAAS FOOTER (CLEAN - NO ALL SYSTEMS OPERATIONAL) */}
            <footer className="landing-footer">
                <div className="landing-shell">
                    <div className="landing-footer-grid">
                        {/* Brand Column */}
                        <div className="landing-footer-brand-col">
                            <a className="landing-brand landing-brand--footer" href="#landing-main">
                                <img
                                    src="/landing/brand-mark.webp"
                                    width="32"
                                    height="32"
                                    alt="MuscleBot Logo"
                                    loading="lazy"
                                    decoding="async"
                                />
                                <span>MuscleBot</span>
                            </a>
                            <p className="landing-footer-tagline">
                                The intelligent operating system for training, nutrition, and progressive overload.
                            </p>
                        </div>

                        {/* Product Links */}
                        <div className="landing-footer-col">
                            <h4>Product</h4>
                            <ul>
                                <li><a href="#features">AI Coach</a></li>
                                <li><a href="#features">Muscle Heatmaps</a></li>
                                <li><a href="#features">Nutrition Scanner</a></li>
                                <li><a href="#analytics">Volume Analytics</a></li>
                                <li><a href="#pricing">Pricing Plans</a></li>
                            </ul>
                        </div>

                        {/* Platform & Resources */}
                        <div className="landing-footer-col">
                            <h4>Platform</h4>
                            <ul>
                                <li><button type="button" onClick={() => navigateToAuth('signup')}>Web App</button></li>
                                <li><button type="button" onClick={() => navigateToAuth('signup')}>iOS & Android</button></li>
                                <li><a href="#how-it-works">How It Works</a></li>
                                <li><a href="#faq">Help & FAQ</a></li>
                            </ul>
                        </div>

                        {/* Legal */}
                        <div className="landing-footer-col">
                            <h4>Legal & Support</h4>
                            <ul>
                                <li><button type="button" onClick={() => navigate('/privacy')}>Privacy Policy</button></li>
                                <li><button type="button" onClick={() => navigate('/terms')}>Terms of Service</button></li>
                                <li><button type="button" onClick={() => navigate('/delete-account')}>Delete Account</button></li>
                            </ul>
                        </div>
                    </div>

                    <div className="landing-footer-bottom">
                        <p>© {new Date().getFullYear()} MuscleBot Inc. All rights reserved.</p>
                        <p className="landing-footer-builtwith">Built for dedicated athletes worldwide.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
