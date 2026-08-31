import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    BrainCircuit,
    Flame,
    Sparkles,
    Star,
    Menu,
    X
} from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
    const navigate = useNavigate();
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
            </main>
        </div>
    );
}
