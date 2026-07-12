import crypto from 'crypto';

const getEncryptionKey = () => {
  // Use a dedicated ENCRYPTION_KEY if available, fallback to JWT_SECRET, or fallback to dev key
  // It must be exactly 32 bytes for aes-256-cbc. We use sha256 to ensure this.
  const rawKey = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'super-secret-fallback-key-for-dev-and-prod-12345';
  return crypto.createHash('sha256').update(String(rawKey)).digest('base64').substring(0, 32);
};

const IV_LENGTH = 16;

/**
 * Encrypts a string using AES-256-CBC
 * Adds an 'enc:' prefix to identify encrypted strings
 */
export function encrypt(text: string): string {
  if (!text) return text;
  // If already encrypted, don't encrypt again
  if (text.startsWith('enc:')) return text;

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return 'enc:' + iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts an 'enc:' prefixed string using AES-256-CBC
 * Returns the original string if not encrypted (backward compatibility)
 */
export function decrypt(text: string): string {
  if (!text) return text;
  // If not encrypted, return as is (for backward compatibility)
  if (!text.startsWith('enc:')) return text;

  try {
    const textParts = text.replace('enc:', '').split(':');
    const iv = Buffer.from(textParts.shift() as string, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const key = getEncryptionKey();
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption failed:', error);
    // Do not throw to avoid crashing the app on bad legacy data, 
    // but return the text or handle it carefully.
    return text;
  }
}
