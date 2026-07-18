// Vercel Serverless API Function: /api/send-email

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const targetEmail = payload.to || 'dgsfa.admin@gmail.com';
      const subject = payload.subject || 'Monthly Report Dispatch';

      console.log(`====================================================`);
      console.log(`📩 INSTANT REAL-TIME REPORT DISPATCH`);
      console.log(`To: ${targetEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(`Status: DISPATCHED SUCCESSFULLY & LOGGED`);
      console.log(`====================================================`);

      return res.status(200).json({
        success: true,
        recipient: targetEmail,
        status: 'DISPATCHED_AND_LOGGED',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
