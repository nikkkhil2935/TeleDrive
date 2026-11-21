import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { CustomFile } from 'telegram/client/uploads';
import { Api } from 'telegram/tl';

console.log('Testing GramJS client initialization in browser...');

// Check classes and constructors
export const testGramJsExports = () => {
  const session = new StringSession('');
  const client = new TelegramClient(session, 12345, 'sample_hash_abcdef1234567890', {
    connectionRetries: 5,
    useWSS: true, // Use WebSockets in browser
  });

  return {
    clientReady: !!client,
    sessionReady: !!session,
    hasUpload: typeof client.uploadFile === 'function',
    hasSendFile: typeof client.sendFile === 'function',
    hasGetMessages: typeof client.getMessages === 'function',
    hasDownloadMedia: typeof client.downloadMedia === 'function',
    hasIterDownload: typeof client.iterDownload === 'function',
    hasCustomFile: typeof CustomFile === 'function',
    hasApi: !!Api,
  };
};

const results = testGramJsExports();
console.log('GramJS Browser Export Check:', results);
if (typeof document !== 'undefined') {
  const el = document.getElementById('output');
  if (el) {
    el.innerHTML = '<pre>' + JSON.stringify(results, null, 2) + '</pre>';
  }
}
