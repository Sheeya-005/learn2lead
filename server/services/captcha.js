const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_women_safety_key_2026_safe';

function generateRandomAlphanumeric(length = 5) {
  // Use uppercase letters and numbers, excluding confusing characters (I, O, 0, 1, L)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

function generateCaptchaSvg(text) {
  const width = 130;
  const height = 45;
  const textColor = '#065f46'; // High contrast deep emerald green
  const bgColor = '#ecfdf5';   // Crisp light emerald green background
  
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background-color: ${bgColor}; border: 1px solid #a7f3d0; border-radius: 6px; user-select: none;">
      <text 
        x="50%" 
        y="54%" 
        dominant-baseline="middle" 
        text-anchor="middle" 
        fill="${textColor}" 
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
        font-weight="800" 
        font-size="22" 
        letter-spacing="4"
      >
        ${text}
      </text>
    </svg>
  `;

  // Convert to Base64 data URI
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

function createCaptcha() {
  const text = generateRandomAlphanumeric(5);
  const image = generateCaptchaSvg(text);
  
  // Sign the captcha token with JWT (expires in 3 minutes)
  const token = jwt.sign(
    { answer: text },
    JWT_SECRET,
    { expiresIn: '3m' }
  );

  return {
    image,
    token
  };
}

function verifyCaptcha(token, clientAnswer) {
  try {
    if (!token || !clientAnswer) {
      return false;
    }
    
    // Decode and verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check answer case-insensitively and trimmed
    return String(decoded.answer).trim().toLowerCase() === String(clientAnswer).trim().toLowerCase();
  } catch (error) {
    // Token expired or invalid
    return false;
  }
}

module.exports = {
  createCaptcha,
  verifyCaptcha
};
