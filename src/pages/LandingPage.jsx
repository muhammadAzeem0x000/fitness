import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
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

            <main id="landing-main" style={{ minHeight: '100vh', paddingTop: '100px' }}>
                {/* Content sections will be mounted here */}
            </main>
        </div>
    );
}
