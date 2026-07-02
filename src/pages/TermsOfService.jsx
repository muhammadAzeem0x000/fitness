import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function TermsOfService() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Terms of Service | MuscleBot';
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500/30">
            <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <Button 
                    variant="ghost" 
                    onClick={() => navigate(-1)} 
                    className="mb-8 hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>

                <div className="prose prose-slate dark:prose-invert prose-emerald max-w-none">
                    <h1 className="text-4xl font-extrabold tracking-tight mb-2">Terms of Service</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using the MuscleBot application ("App"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the App.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-emerald-600 dark:text-emerald-400">2. Health & Medical Disclaimer</h2>
                        <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 p-4 rounded-r-lg my-4">
                            <p className="font-semibold text-amber-900 dark:text-amber-200 m-0">
                                MuscleBot is NOT a medical professional. The App, including its AI features, provides informational and educational content only.
                            </p>
                        </div>
                        <p>
                            Always consult with a qualified healthcare provider or a certified personal trainer before beginning any new fitness, nutrition, or weight loss program. You acknowledge that participating in exercise activities involves inherent risks of physical injury, and you assume all such risks. MuscleBot and its creators are not liable for any injuries, damages, or health issues that may result from using our suggested routines, exercises, or dietary recommendations.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-emerald-600 dark:text-emerald-400">3. Artificial Intelligence Disclaimer</h2>
                        <p>
                            MuscleBot utilizes Artificial Intelligence (AI) to generate coaching feedback, workout routines, and meal plans. You understand and agree that:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li>AI-generated content is based on patterns and data and may not always be perfectly accurate, complete, or suitable for your specific circumstances.</li>
                            <li>The AI can "hallucinate" or provide incorrect or nonsensical advice.</li>
                            <li>You must exercise your own judgment and common sense before following any AI-generated guidance.</li>
                            <li>MuscleBot is not responsible for any adverse outcomes resulting from reliance on AI-generated content.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">4. User Accounts and Data</h2>
                        <p>
                            When you create an account, you must provide accurate and complete information. You are responsible for safeguarding your password and for all activities that occur under your account. By using the App, you consent to the collection and use of your data as described in our Privacy Policy, including sharing necessary data with third-party AI providers (e.g., OpenAI) to generate personalized feedback.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">5. Acceptable Use</h2>
                        <p>
                            You agree not to use the App for any unlawful purpose or in any way that interrupts, damages, or impairs the service. You may not attempt to reverse engineer, manipulate, or exploit the AI systems or the App's infrastructure.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">6. Limitation of Liability</h2>
                        <p>
                            To the maximum extent permitted by law, MuscleBot, its developers, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of your access to or use of, or inability to access or use, the App.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">7. Changes to Terms</h2>
                        <p>
                            We reserve the right to modify these terms at any time. We will notify users of significant changes. Your continued use of the App after such modifications constitutes your acceptance of the new terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">8. Contact Us</h2>
                        <p>
                            If you have any questions about these Terms, please contact us at support@musclebot.app.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
