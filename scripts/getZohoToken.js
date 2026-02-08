import { createInterface } from 'readline';

const CLIENT_ID = '1000.C21PQP77AZORRPBCD8RSL1QW7TMQTV';
const CLIENT_SECRET = '4c0d48a7ab20a102c07db6bd248b3b09cb770dbedd';
// Self Client redirection is effectively internal, but for the API we pass the self-client portal or dummy
// Actually for 'grant_type=authorization_code', redirect_uri is required but can be dummy for self-client sometimes?
// No, for Self Client "Generate Code", we don't need redirect_uri in the POST usually, OR it matches the console.
// Let's try standard params.

const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n=== Zoho CRM Access Token Generator ===');
console.log('1. Go to Zoho API Console > Self Client');
console.log('2. Enter Scope: ZohoCRM.modules.ALL,ZohoCRM.coql.READ');
console.log('3. Set Expiry to 10 mins');
console.log('4. Click "Generate"');
console.log('5. Copy the "Authorization Code"');
console.log('---------------------------------------');

rl.question('Paste Authorization Code here: ', async (code) => {
    if (!code) {
        console.error('Code is required!');
        process.exit(1);
    }

    // Use .in for Indian accounts
    const domain = 'accounts.zoho.in';
    const tokenUrl = `https://${domain}/oauth/v2/token`;

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('redirect_uri', 'https://oauth.zoho.com'); // Standard for Self Client? often it's this.
    params.append('code', code);

    try {
        console.log(`\nExchanging code with ${domain}...`);
        const response = await fetch(tokenUrl, {
            method: 'POST',
            body: params
        });

        const data = await response.json();

        if (data.error) {
            console.error('\n❌ Error:', data.error);
            console.error('Details:', data);
        } else {
            console.log('\n✅ Success! Here is your Access Token:');
            console.log('\n' + data.access_token + '\n');
            console.log('Copy this token into the "Access Token" field in the Zero-UI App.');
            if (data.refresh_token) {
                console.log('(Refresh Token also received, but we only need Access Token for now)');
            }
        }
    } catch (err) {
        console.error('Network Error:', err);
    } finally {
        rl.close();
    }
});
