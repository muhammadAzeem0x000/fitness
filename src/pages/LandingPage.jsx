import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity,
    ArrowRight,
    BrainCircuit,
    Dumbbell,
    Sparkles,
    Utensils,
} from 'lucide-react';
import './LandingPage.css';

const pillars = [
    {
        icon: Dumbbell,
        title: 'Plan with purpose',
        description: 'Structured workouts built around what you need today.',
    },
    {
        icon: Utensils,
        title: 'Track without friction',
        description: 'Meals, macros, and training logs in one natural flow.',
    },
    {
        icon: Activity,
        title: 'See the full picture',
        description: 'Readiness, volume, weight, and muscle activity made clear.',
    },
];

export default function LandingPage() {
    const navigate = useNavigate();
    const navigateToAuth = (view) => navigate('/auth', { state: { view } });

    return (
        <div className="musclebot-landing">
            <a className="landing-skip-link" href="#landing-main">
                Skip to content
            </a>

            <header className="landing-header">
                <nav className="landing-shell landing-nav" aria-label="Main navigation">
                    <a className="landing-brand" href="#landing-main" aria-label="MuscleBot home">
                        <img
                            src="/landing/brand-mark.webp"
                            width="48"
                            height="48"
                            alt=""
                            decoding="async"
                        />
                        <span>MuscleBot</span>
                    </a>

                    <div className="landing-nav-links">
                        <a href="#product">Product</a>
                        <a href="#features">Features</a>
                    </div>

                    <div className="landing-nav-actions">
                        <button
                            className="landing-text-button"
                            type="button"
                            onClick={() => navigateToAuth('login')}
                        >
                            Sign in
                        </button>
                        <button
                            className="landing-button landing-button--compact"
                            type="button"
                            onClick={() => navigateToAuth('signup')}
                        >
                            Get started
                        </button>
                    </div>
                </nav>
            </header>

            <main id="landing-main">
                <section className="landing-hero" aria-labelledby="landing-title">
                    <div className="landing-shell landing-hero-grid">
                        <div className="landing-hero-copy">
                            <p className="landing-eyebrow">
                                <span aria-hidden="true" />
                                AI-guided training intelligence
                            </p>
                            <h1 id="landing-title">
                                Know what to
                                <span>do next.</span>
                            </h1>
                            <p className="landing-hero-description">
                                MuscleBot brings workouts, nutrition, readiness, and progress into one focused
                                system—so every session starts with clarity.
                            </p>

                            <div className="landing-hero-actions">
                                <button
                                    className="landing-button landing-button--primary"
                                    type="button"
                                    onClick={() => navigateToAuth('signup')}
                                >
                                    Get started
                                    <ArrowRight aria-hidden="true" size={18} strokeWidth={2} />
                                </button>
                                <a className="landing-secondary-link" href="#product">
                                    Explore the app
                                </a>
                            </div>

                            <p className="landing-capability-line">
                                Workout planning <span aria-hidden="true">·</span> Nutrition tracking{' '}
                                <span aria-hidden="true">·</span> Progress insights
                            </p>
                        </div>

                        <div className="landing-hero-visual" aria-label="MuscleBot muscle activity insights">
                            <div className="landing-product-frame">
                                <div className="landing-frame-bar" aria-hidden="true">
                                    <span />
                                    <span />
                                    <span />
                                    <small>INSIGHTS / MUSCLE ACTIVITY</small>
                                </div>
                                <img
                                    src="/landing/muscle-map-1280.webp"
                                    srcSet="/landing/muscle-map-640.webp 640w, /landing/muscle-map-1280.webp 1280w"
                                    sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1200px) 48vw, 590px"
                                    width="1280"
                                    height="1024"
                                    alt="MuscleBot showing dark and light muscle activity maps"
                                    loading="eager"
                                    fetchPriority="high"
                                    decoding="async"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="landing-pillars" id="features" aria-label="Core capabilities">
                    <div className="landing-shell landing-pillar-grid">
                        {pillars.map(({ icon, title, description }) => (
                            <article className="landing-pillar" key={title}>
                                <span className="landing-pillar-icon" aria-hidden="true">
                                    {React.createElement(icon, { size: 19, strokeWidth: 1.8 })}
                                </span>
                                <div>
                                    <h2>{title}</h2>
                                    <p>{description}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="landing-product" id="product" aria-labelledby="product-title">
                    <div className="landing-shell">
                        <div className="landing-section-heading">
                            <p className="landing-section-label">One connected system</p>
                            <h2 id="product-title">The work. The inputs. The result.</h2>
                            <p>
                                Plan the session, track the details, and understand the outcome without moving
                                between disconnected tools.
                            </p>
                        </div>

                        <div className="landing-feature-grid">
                            <article className="landing-feature-card landing-feature-card--coach">
                                <div className="landing-feature-copy">
                                    <span className="landing-feature-icon" aria-hidden="true">
                                        <BrainCircuit size={20} strokeWidth={1.8} />
                                    </span>
                                    <p className="landing-feature-label">AI Coach</p>
                                    <h3>Guidance grounded in your history.</h3>
                                    <p>
                                        Ask questions about your logged training and nutrition, then review weekly
                                        and monthly reports in the same place.
                                    </p>
                                </div>
                                <div className="landing-feature-image landing-feature-image--landscape">
                                    <img
                                        src="/landing/ai-coach-1120.webp"
                                        srcSet="/landing/ai-coach-640.webp 640w, /landing/ai-coach-1120.webp 1120w"
                                        sizes="(max-width: 767px) calc(100vw - 64px), (max-width: 1200px) 56vw, 680px"
                                        width="1120"
                                        height="896"
                                        alt="MuscleBot AI Coach chat and reports screens"
                                        loading="eager"
                                        fetchPriority="high"
                                        decoding="async"
                                    />
                                </div>
                            </article>

                            <article className="landing-feature-card landing-feature-card--nutrition">
                                <div className="landing-feature-copy">
                                    <span className="landing-feature-icon" aria-hidden="true">
                                        <Utensils size={20} strokeWidth={1.8} />
                                    </span>
                                    <p className="landing-feature-label">Nutrition</p>
                                    <h3>Log food the way you describe it.</h3>
                                    <p>
                                        Capture everyday meals, follow calorie and macro targets, and keep your plan
                                        beside your training.
                                    </p>
                                </div>
                                <div className="landing-feature-image landing-feature-image--landscape">
                                    <img
                                        src="/landing/nutrition-1120.webp"
                                        srcSet="/landing/nutrition-640.webp 640w, /landing/nutrition-1120.webp 1120w"
                                        sizes="(max-width: 767px) calc(100vw - 64px), (max-width: 1200px) 38vw, 450px"
                                        width="1120"
                                        height="896"
                                        alt="MuscleBot nutrition tracking and meal planning screens"
                                        loading="eager"
                                        fetchPriority="high"
                                        decoding="async"
                                    />
                                </div>
                            </article>
                        </div>

                        <article className="landing-progress-card">
                            <div className="landing-progress-copy">
                                <span className="landing-feature-icon" aria-hidden="true">
                                    <Activity size={20} strokeWidth={1.8} />
                                </span>
                                <p className="landing-feature-label">Progress</p>
                                <h3>Progress you can actually read.</h3>
                                <p>
                                    Follow weight and training volume over time, then connect the numbers to the work
                                    you are doing.
                                </p>
                                <ul aria-label="Progress views">
                                    <li>Weight trends</li>
                                    <li>Training volume</li>
                                    <li>Muscle activity</li>
                                </ul>
                            </div>
                            <div className="landing-progress-image">
                                <img
                                    src="/landing/progress-720.webp"
                                    srcSet="/landing/progress-420.webp 420w, /landing/progress-720.webp 720w"
                                    sizes="(max-width: 767px) calc(100vw - 64px), 410px"
                                    width="720"
                                    height="1280"
                                    alt="MuscleBot weight and training volume charts"
                                    loading="eager"
                                    fetchPriority="high"
                                    decoding="async"
                                />
                            </div>
                        </article>
                    </div>
                </section>

                <section className="landing-final-section" aria-labelledby="final-cta-title">
                    <div className="landing-shell landing-final-card">
                        <span className="landing-final-icon" aria-hidden="true">
                            <Sparkles size={20} strokeWidth={1.8} />
                        </span>
                        <p className="landing-section-label">Start with clarity</p>
                        <h2 id="final-cta-title">Make every session count.</h2>
                        <p>Bring your training, nutrition, and progress into one focused system.</p>
                        <div className="landing-final-actions">
                            <button
                                className="landing-button landing-button--light"
                                type="button"
                                onClick={() => navigateToAuth('signup')}
                            >
                                Create your account
                                <ArrowRight aria-hidden="true" size={18} strokeWidth={2} />
                            </button>
                            <button
                                className="landing-final-signin"
                                type="button"
                                onClick={() => navigateToAuth('login')}
                            >
                                Sign in
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="landing-footer">
                <div className="landing-shell landing-footer-content">
                    <div>
                        <a className="landing-brand landing-brand--footer" href="#landing-main">
                            <img
                                src="/landing/brand-mark.webp"
                                width="40"
                                height="40"
                                alt=""
                                loading="eager"
                                decoding="async"
                            />
                            <span>MuscleBot</span>
                        </a>
                        <p>AI-guided training intelligence.</p>
                    </div>
                    <div className="landing-footer-links" aria-label="Legal links">
                        <button type="button" onClick={() => navigate('/privacy')}>
                            Privacy
                        </button>
                        <button type="button" onClick={() => navigate('/terms')}>
                            Terms
                        </button>
                        <span>© {new Date().getFullYear()} MuscleBot</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
