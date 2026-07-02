import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function PrivacyPolicy() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Privacy Policy | MuscleBot';
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
                    <h1 className="text-4xl font-extrabold tracking-tight mb-2">Privacy Policy</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                        <p>
                            At MuscleBot, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile or web application.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
                        <p>We collect information that you provide directly to us when using the App:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li><strong>Account Information:</strong> Email address and authentication credentials.</li>
                            <li><strong>Profile & Biometrics:</strong> Height, weight, age, fitness goals, and experience level.</li>
                            <li><strong>Fitness Data:</strong> Workout logs, exercises performed, sets, reps, and weights.</li>
                            <li><strong>Nutrition Data:</strong> Meals logged, macronutrients, and dietary preferences.</li>
                            <li><strong>Usage Data:</strong> How you interact with the App, features used, and device information.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-emerald-600 dark:text-emerald-400">3. How We Use Your Data (Including AI)</h2>
                        <p>We use the information we collect primarily to provide, maintain, and improve the MuscleBot experience:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li>To create and manage your account.</li>
                            <li>To track your fitness and nutrition progress over time.</li>
                            <li><strong>AI Coaching:</strong> We process your workout and nutrition data, along with your goals, through third-party Artificial Intelligence services (e.g., OpenAI) to generate personalized coaching insights, routine adjustments, and meal suggestions.</li>
                            <li>To communicate with you regarding updates, security alerts, and support messages.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">4. Data Sharing and Third Parties</h2>
                        <p>
                            <strong>We do not sell your personal data to third parties.</strong> We may share your data in the following situations:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li><strong>Service Providers:</strong> We share data with trusted service providers (like Supabase for database hosting and authentication, and OpenAI for AI processing) who assist us in operating the App. These providers are bound by strict confidentiality and data protection agreements.</li>
                            <li><strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
                        <p>
                            We implement commercially reasonable security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">6. Your Data Rights</h2>
                        <p>
                            Depending on your location, you may have the right to access, update, or delete your personal information. You can manage your data within the App's settings or by contacting us. If you wish to delete your account entirely, you can request account deletion, which will permanently remove your data from our active databases.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">7. Children's Privacy</h2>
                        <p>
                            Our App is not intended for children under the age of 13 (or higher as required by local laws). We do not knowingly collect personal information from children. If we discover that a child has provided us with personal information, we will delete it immediately.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">8. Contact Us</h2>
                        <p>
                            If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at privacy@musclebot.app.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
