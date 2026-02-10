// Run this in browser console to get your access token and test the edge function

(async () => {
    const { data: { session } } = await window.supabase.auth.getSession();

    if (!session) {
        console.error("❌ NO SESSION - You're not logged in!");
        return;
    }

    console.log("✅ Access Token:", session.access_token.substring(0, 30) + "...");

    // Test edge function
    const response = await fetch('https://hvjchdgthkxqdvxrjero.supabase.co/functions/v1/create-checkout-session', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            priceId: 'price_1SyZu2ESf91DrGyEmicC8ALM'
        })
    });

    console.log("📊 Response Status:", response.status);
    const data = await response.json();
    console.log("📦 Response Body:", data);

    if (data.error) {
        console.error("❌ Error:", data.error);
    } else if (data.sessionId) {
        console.log("✅ SUCCESS! Session ID:", data.sessionId);
    }
})();
