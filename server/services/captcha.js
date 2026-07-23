const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_women_safety_key_2026_safe';

function generateRandomMath() {
  const num1 = Math.floor(Math.random() * 12) + 4; // 4 to 15
  const num2 = Math.floor(Math.random() * 8) + 1; // 1 to 8
  const operations = ['+', '-'];
  const operation = operations[Math.floor(Math.random() * operations.length)];

  let answer;
  if (operation === '+') {
    answer = num1 + num2;
  } else {
    answer = num1 - num2;
  }

  const equation = `${num1} ${operation} ${num2}`;
  return { equation, answer };
}

function generateCaptchaSvg(text) {
  const width = 130;
  const height = 45;
  
  // Add some random noise lines
  let lines = '';
  for (let i = 0; i < 4; i++) {
    const x1 = Math.floor(Math.random() * width);
    const y1 = Math.floor(Math.random() * height);
    const x2 = Math.floor(Math.random() * width);
    const y2 = Math.floor(Math.random() * height);
    const color = `hsl(${Math.floor(Math.random() * 360)}, 30%, 60%)`;
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" opacity="0.6" />`;
  }

  // Add random noise dots
  let dots = '';
  for (let i = 0; i < 30; i++) {
    const cx = Math.floor(Math.random() * width);
    const cy = Math.floor(Math.random() * height);
    const r = Math.floor(Math.random() * 2) + 1;
    const color = `hsl(${Math.floor(Math.random() * 360)}, 20%, 70%)`;
    dots += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="0.5" />`;
  }

  // Generate SVG with slightly skewed/rotated text
  const rotation = Math.floor(Math.random() * 10) - 5; // -5 to +5 deg
  const textColor = '#e2e8f0'; // Tailwind Slate-200 compatible color
  
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background-color: #1e293b; border-radius: 6px; user-select: none;">
      ${lines}
      ${dots}
      <text 
        x="50%" 
        y="55%" 
        dominant-baseline="middle" 
        text-anchor="middle" 
        fill="${textColor}" 
        font-family="Courier, monospace" 
        font-weight="bold" 
        font-size="20" 
        transform="rotate(${rotation} ${width/2} ${height/2})"
        letter-spacing="2"
      >
        ${text} = ?
      </text>
    </svg>
  `;

  // Convert to Base64 data URI
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

function createCaptcha() {
  const { equation, answer } = generateRandomMath();
  const image = generateCaptchaSvg(equation);
  
  // Sign the captcha token with JWT (expires in 3 minutes)
  const token = jwt.sign(
    { answer: String(answer) },
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
    if (!token || !clientAnswer) return false;
    
    // Decode and verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check answer case-insensitively and trimmed
    return String(decoded.answer).trim() === String(clientAnswer).trim();
  } catch (error) {
    // Token expired or invalid
    return false;
  }
}

module.exports = {
  createCaptcha,
  verifyCaptcha
};
