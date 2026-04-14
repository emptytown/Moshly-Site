
const crypto = require('crypto');

// Utility to match the backend hashing
async function sha256Hex(input) {
  const hash = crypto.createHash('sha256');
  hash.update(input);
  return hash.digest('hex');
}

// Simulated DB State
let db = {
    users: [],
    emailsSent: []
};

// Simulation of resendVerification
async function resendVerification(user) {
    const newToken = 'new_token_' + Math.random().toString(36).substring(7);
    const newTokenHash = await sha256Hex(newToken);
    user.verificationToken = newTokenHash;
    user.verificationExpires = new Date(Date.now() + 3600000);
    db.emailsSent.push({ to: user.email, token: newToken });
    return true;
}

// Simulation of /api/verify-email
async function verifyEmail(token) {
    const tokenHash = await sha256Hex(token);
    const user = db.users.find(u => u.verificationToken === tokenHash);

    if (!user) {
        return { status: 400, body: { error: 'invalid_token', message: 'Invalid or expired verification token' } };
    }

    // Case C: Email already confirmed
    if (user.emailVerified) {
        return { status: 200, body: { success: true, message: 'Your email has been successfully confirmed. You can now log in.' } };
    }

    const now = new Date();
    if (user.verificationExpires && user.verificationExpires < now) {
        // Case B: Token expired
        await resendVerification(user);
        return { status: 400, body: { error: 'token_expired', message: 'Your confirmation link has expired. We’ve sent you a new confirmation email. Please confirm your account using the latest email.' } };
    }

    // Case A: Valid and unconfirmed -> Confirm now
    user.emailVerified = true;
    user.verificationExpires = null; // Clear expiration but keep token for Case C
    return { status: 200, body: { success: true, message: 'Your email has been successfully confirmed. You can now log in.' } };
}

// Simulation of /api/login
async function login(email) {
    const user = db.users.find(u => u.email === email);
    if (!user) return { status: 401, body: { message: 'Invalid credentials' } };

    if (!user.emailVerified) {
        const now = new Date();
        if (user.verificationExpires && user.verificationExpires < now) {
            // Case B: Expired
            await resendVerification(user);
            return { status: 403, body: { error: 'email_validation_expired', message: 'Your confirmation link has expired. We’ve sent you a new confirmation email. Please confirm your account using the latest email.' } };
        }
        // Case A: Valid but unconfirmed
        return { status: 403, body: { error: 'email_unverified', message: 'Your confirmation link is still valid, but your account has not been confirmed yet. Please check your inbox and complete the verification.' } };
    }

    return { status: 200, body: { success: true } };
}

async function runTests() {
    console.log("=== EMAIL CONFIRMATION FLOW VALIDATION ===\n");

    // SETUP
    const tokenA = 'tokenA';
    const tokenB = 'tokenB';
    const tokenC = 'tokenC';
    const hashA = await sha256Hex(tokenA);
    const hashB = await sha256Hex(tokenB);
    const hashC = await sha256Hex(tokenC);

    db.users = [
        { email: 'valid@test.com', emailVerified: false, verificationToken: hashA, verificationExpires: new Date(Date.now() + 3600000) },
        { email: 'expired@test.com', emailVerified: false, verificationToken: hashB, verificationExpires: new Date(Date.now() - 3600000) },
        { email: 'already@test.com', emailVerified: true, verificationToken: hashC, verificationExpires: null }
    ];

    // CASE A: Valid but unconfirmed
    console.log("A) Testing: Valid but unconfirmed (email: valid@test.com)");
    const resA1 = await login('valid@test.com');
    console.log("   - Login attempt: Status", resA1.status, "| Message:", resA1.body.message);
    const resA2 = await verifyEmail(tokenA);
    console.log("   - Verification (link click): Status", resA2.status, "| Message:", resA2.body.message);
    const userA = db.users.find(u => u.email === 'valid@test.com');
    console.log("   - DB Final State: verified =", userA.emailVerified, "| token still exists =", !!userA.verificationToken);
    if (resA1.status === 403 && resA2.status === 200 && userA.emailVerified === true) {
        console.log("   ✅ Case A: PASSED\n");
    } else {
        console.log("   ❌ Case A: FAILED\n");
    }

    // CASE B: Token expired
    console.log("B) Testing: Expired (email: expired@test.com)");
    const prevTokenB = db.users.find(u => u.email === 'expired@test.com').verificationToken;
    
    // First, test direct verification click with expired token
    const resB2 = await verifyEmail(tokenB);
    console.log("   - Verification click (expired): Status", resB2.status, "| Message:", resB2.body.message);
    const newTokenB_afterVerify = db.users.find(u => u.email === 'expired@test.com').verificationToken;
    console.log("   - New token generated after verify:", newTokenB_afterVerify !== prevTokenB);

    const resB1 = await login('expired@test.com');
    console.log("   - Login attempt (should notice new expired token if it were expired, but here it's new): Status", resB1.status);
    
    const emailB = db.emailsSent.find(e => e.to === 'expired@test.com');
    console.log("   - New email sent:", !!emailB);
    
    if (resB2.status === 400 && resB2.body.message.includes("expired") && newTokenB_afterVerify !== prevTokenB && !!emailB) {
        console.log("   ✅ Case B: PASSED\n");
    } else {
        console.log("   ❌ Case B: FAILED\n");
    }

    // CASE C: Email already confirmed
    console.log("C) Testing: Already confirmed (email: already@test.com)");
    const prevEmailsCount = db.emailsSent.length;
    const resC1 = await verifyEmail(tokenC);
    console.log("   - Click on link for confirmed account: Status", resC1.status, "| Message:", resC1.body.message);
    const noNewEmails = db.emailsSent.length === prevEmailsCount;
    console.log("   - No re-sent email:", noNewEmails);
    
    if (resC1.status === 200 && noNewEmails) {
        console.log("   ✅ Case C: PASSED\n");
    } else {
        console.log("   ❌ Case C: FAILED\n");
    }
}

runTests();
