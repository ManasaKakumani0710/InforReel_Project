const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);




const createVerificationSession = async (req, res) => {
  try {
    const { userId, fullName, email ,userType } = req.body;

    if (userType !== 'vendor') {
        return res.status(403).json({ message: 'Identity verification is only required for vendors.' });
      }

    const session = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        user_id: userId,
        full_name: fullName,
        email
      },
      return_url: process.env.STRIPE_RETURN_URL
    });

    res.status(200).json({
      sessionId: session.id,
      clientSecret: session.client_secret,
      redirectUrl: session.url
    });
  } catch (err) {
    console.error('Stripe Identity Session Error:', err);
    res.status(500).json({ message: 'Failed to create verification session' });
  }
};


const checkVerificationStatus = async (req, res) => {
    try {
      const { sessionId } = req.params;
  
      const session = await stripe.identity.verificationSessions.retrieve(sessionId);
  
      res.status(200).json({
        status: session.status,
        verifiedOutputs: session.verified_outputs
      });
    } catch (err) {
      console.error('Check Verification Error:', err);
      res.status(500).json({ message: 'Failed to retrieve verification status' });
    }
  };
  
module.exports = { createVerificationSession, checkVerificationStatus };
  
