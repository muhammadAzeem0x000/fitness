const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    'vite.config.js',
    'index.html',
    'src/pages/Success.jsx',
    'src/pages/SharedWorkout.jsx',
    'src/pages/Pricing.jsx',
    'src/pages/OnboardingPage.jsx',
    'src/pages/LandingPage.jsx',
    'src/lib/openai.js',
    'src/lib/aiChat.js',
    'src/components/workout/ShareModal.jsx',
    'src/components/workout/ActiveSessionView.jsx',
    'src/components/premium/PremiumGate.jsx',
    'src/components/layout/MobileHeader.jsx',
    'src/components/layout/Layout.jsx',
    'src/components/layout/Header.jsx',
    'src/components/auth/Auth.jsx',
    'STRIPE_SETUP_GUIDE.md',
    'REMAINING_PHASES.md',
    'MASTER_ROADMAP.md'
];

filesToUpdate.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(/SmartFit/g, 'MuscleBot');
        // Let's ensure exact case preservation where possible for 'smartfit' if any exist
        content = content.replace(/smartfit/g, 'musclebot');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    } else {
        console.log(`Skipped ${file} - not found`);
    }
});
