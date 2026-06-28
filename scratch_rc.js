const https = require('https');

const options = {
  hostname: 'api.revenuecat.com',
  path: '/v1/subscribers/test_user/offerings',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer goog_YsyJpjaEanolAaMyFZvFDYDQnqW',
    'X-Platform': 'android'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Status:", res.statusCode);
    console.log("Response:", JSON.stringify(JSON.parse(data), null, 2));
  });
});

req.on('error', e => console.error(e));
req.end();
