const https = require('https');

https.get('https://fitness-gilt-nine.vercel.app/pricing', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const match = data.match(/assets\/index-[^.]*\.js/);
        if (match) {
            console.log('Found JS file:', match[0]);
            https.get('https://fitness-gilt-nine.vercel.app/' + match[0], (jsRes) => {
                let jsData = '';
                jsRes.on('data', chunk => jsData += chunk);
                jsRes.on('end', () => {
                    if (jsData.includes('price_1SyZu2ESf91DrGyEmicC8ALM')) {
                        console.log('✅ Found MONTHLY price ID in JS bundle');
                    } else {
                        console.log('❌ MONTHLY price ID NOT FOUND in JS bundle');
                    }
                    if (jsData.includes('price_1SyZv4ESf91DrGyE8jhwxFZK')) {
                        console.log('✅ Found YEARLY price ID in JS bundle');
                    } else {
                        console.log('❌ YEARLY price ID NOT FOUND in JS bundle');
                    }
                });
            });
        } else {
            console.log('Could not find Pricing JS file in HTML');
        }
    });
});
