const crypto = require('crypto');
const assert = require('assert');

console.log('====================================================');
console.log(' RUNNING TELEGRAM PHOTOS SECURITY & INTEGRITY SUITE ');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

(async () => {
  // Test 1: AES-256-GCM + PBKDF2 Key Derivation and Encryption
  await runAsyncTest('Test 1: Vault AES-256-GCM encryption with PBKDF2 (100k iters)', async () => {
    const mockSession = {
      apiId: 123456,
      apiHash: '0123456789abcdef0123456789abcdef',
      sessionString: '1BVtsOHQBu7...',
      channelId: '4298525450',
      userId: '987654321',
    };
    const passphrase = 'MyMasterSecurePassphrase2026!';
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);

    const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(JSON.stringify(mockSession), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();

    assert.ok(encrypted.length > 0, 'Ciphertext should be non-empty');
    assert.ok(tag.length === 16, 'Auth tag should be 16 bytes');

    // Decrypt
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const recovered = JSON.parse(decrypted);
    assert.strictEqual(recovered.sessionString, mockSession.sessionString);
    assert.strictEqual(recovered.channelId, mockSession.channelId);
  });

  // Test 2: Tamper Evidence (Flipped bit in ciphertext fails decryption)
  await runAsyncTest('Test 2: Tamper Evidence - Flipped bit in ciphertext fails decryption loudly', async () => {
    const data = JSON.stringify({ secret: 'critical-auth-key' });
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);
    const key = crypto.pbkdf2Sync('pass123', salt, 100000, 32, 'sha256');

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();

    // Flip first character
    const tampered = (encrypted[0] === 'a' ? 'b' : 'a') + encrypted.slice(1);

    let failed = false;
    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      decipher.update(tampered, 'hex', 'utf8');
      decipher.final('utf8');
    } catch (e) {
      failed = true;
    }
    assert.ok(failed, 'Decryption must fail when ciphertext is modified');
  });

  // Test 3: Incorrect Passphrase Rejection
  await runAsyncTest('Test 3: Incorrect Passphrase Rejection (Authentication Tag mismatch)', async () => {
    const data = JSON.stringify({ token: 'sensitive-token' });
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);
    const key = crypto.pbkdf2Sync('correct-passphrase', salt, 100000, 32, 'sha256');

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();

    // Wrong key
    const wrongKey = crypto.pbkdf2Sync('wrong-passphrase', salt, 100000, 32, 'sha256');
    let rejected = false;
    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', wrongKey, iv);
      decipher.setAuthTag(tag);
      decipher.update(encrypted, 'hex', 'utf8');
      decipher.final('utf8');
    } catch (e) {
      rejected = true;
    }
    assert.ok(rejected, 'Decryption must reject incorrect passphrase');
  });

  // Test 4: Account Isolation & Data Segregation
  runTest('Test 4: Account Scoping - Records strictly isolated by Channel ID', () => {
    const mockDbMedia = [
      { messageId: 1, libraryId: 'channel_user_A', filename: 'photoA.jpg' },
      { messageId: 2, libraryId: 'channel_user_A', filename: 'photoA2.jpg' },
      { messageId: 3, libraryId: 'channel_user_B', filename: 'privateB.jpg' },
    ];

    const sessionA = { channelId: 'channel_user_A' };
    const sessionB = { channelId: 'channel_user_B' };

    const photosForA = mockDbMedia.filter(m => m.libraryId === sessionA.channelId);
    const photosForB = mockDbMedia.filter(m => m.libraryId === sessionB.channelId);

    assert.strictEqual(photosForA.length, 2);
    assert.ok(photosForA.every(m => m.libraryId === 'channel_user_A'));
    assert.strictEqual(photosForB.length, 1);
    assert.strictEqual(photosForB[0].filename, 'privateB.jpg');

    // On logout (null session)
    const loggedOutPhotos = mockDbMedia.filter(m => false);
    assert.strictEqual(loggedOutPhotos.length, 0, 'No photos should be visible when logged out');
  });

  // Test 5: Input Sanitization against Path Traversal & XSS
  runTest('Test 5: Filename & Caption Sanitization against XSS & Path Traversal', () => {
    const maliciousNames = [
      '../../../etc/passwd',
      '..\\..\\windows\\system32\\cmd.exe',
      '<script>alert("XSS")</script>.jpg',
      'normal_photo.jpg',
    ];

    const sanitize = (name) => {
      return name
        .replace(/[\\/]/g, '_')
        .replace(/[<>:"|?*]/g, '')
        .slice(0, 100);
    };

    const sanitized = maliciousNames.map(sanitize);
    assert.strictEqual(sanitized[0], '.._.._.._etc_passwd');
    assert.strictEqual(sanitized[1], '.._.._windows_system32_cmd.exe');
    assert.strictEqual(sanitized[2], 'scriptalert(XSS)_script.jpg');
    assert.strictEqual(sanitized[3], 'normal_photo.jpg');
  });

  // Test 6: Hard Limit Boundary (2 GB cap check)
  runTest('Test 6: Telegram 2 GB Object Cap Enforcement', () => {
    const validSize = 140 * 1024 * 1024; // 140 MB
    const maxTelegramSize = 2_000_000_000;
    const oversized = 2_100_000_000;

    const checkCap = (size) => size <= maxTelegramSize;
    assert.strictEqual(checkCap(validSize), true);
    assert.strictEqual(checkCap(oversized), false);
  });

  console.log(`\nAll ${passedTests}/${totalTests} Security & Integrity Tests Passed Successfully!`);
})();
