import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { adminDb } from '../lib/server/firebase-admin.js';
import { requireSession } from '../lib/server/session.js';
import { questionBankTests } from '../content/question-bank.js';

function getB2Client() {
  const endpoint = process.env.B2_S3_ENDPOINT || 'https://s3.eu-central-003.backblazeb2.com';
  if (!process.env.B2_KEY_ID || !process.env.B2_APPLICATION_KEY) return null;

  return new S3Client({
    region: process.env.B2_REGION || 'eu-central-003',
    endpoint,
    credentials: {
      accessKeyId: process.env.B2_KEY_ID,
      secretAccessKey: process.env.B2_APPLICATION_KEY
    }
  });
}

export default async function handler(req, res) {
  const user = await requireSession(req, res);
  if (!user) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const testId = String(req.query?.testId || '');
  const section = Math.max(1, Math.min(4, Number(req.query?.section) || 1));

  if (!testId) {
    return res.status(400).json({ message: 'testId is required.' });
  }

  try {
    let test = null;

    const snap = await adminDb.collection('tests').doc(testId).get();
    if (snap.exists) {
      test = { id: snap.id, ...snap.data() };
    }

    // Fallback to the versioned production bank if Firestore has not yet
    // been re-seeded after the audio paths were added.
    if (!test) {
      test = questionBankTests.find(t => t.id === testId);
    }

    if (!test) {
      return res.status(404).json({ message: 'Listening test not found.' });
    }

    let storagePath = Array.isArray(test.audioStoragePaths)
      ? test.audioStoragePaths[section - 1]
      : null;

    if (!storagePath) {
      const bankTest = questionBankTests.find(t => t.id === testId);
      storagePath = Array.isArray(bankTest?.audioStoragePaths)
        ? bankTest.audioStoragePaths[section - 1]
        : null;
    }

    if (!storagePath) {
      return res.status(404).json({
        message: 'No permanent audio path is configured for this Listening section.'
      });
    }

    const bucketName = process.env.B2_BUCKET_NAME;
    const b2 = getB2Client();

    if (!bucketName || !b2) {
      return res.status(503).json({
        message: 'Backblaze B2 audio storage is not configured on the server.'
      });
    }

    const url = await getSignedUrl(
      b2,
      new GetObjectCommand({
        Bucket: bucketName,
        Key: storagePath
      }),
      { expiresIn: 3600 }
    );

    return res.redirect(302, url);
  } catch (error) {
    console.error('Listening audio error:', error);
    return res.status(502).json({
      message: 'The Listening audio file could not be loaded from Backblaze B2.'
    });
  }
}
