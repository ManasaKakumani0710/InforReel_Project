const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);




const createVerificationSession = async (req, res) => {
  try {
    const {
      userId,
      fullName,
      email,
      userType,
      dob,
      gender,
      ssn,
      address
    } = req.body;

    if (userType !== 'vendor') {
      return res.status(403).json({
        code: 403,
        message: 'Identity verification is only required for vendors.',
        error: 'Unauthorized user type',
        data: null
      });
    }

    
    const session = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        user_id: userId,
        full_name: fullName,
        email,
        dob,
        gender,
        ssn_last_4: ssn,
        address: JSON.stringify(address)
      },
      return_url: process.env.STRIPE_RETURN_URL
    });

    // 2. Create Ephemeral Key (Important: specify API version)
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { verification_session: session.id },
      { apiVersion: '2025-04-30.basil' }  
    );


    return res.status(200).json({
      code: 200,
      message: 'Stripe verification session and ephemeral key created',
      error: null,
      data: {
        sessionId: session.id,
        clientSecret: session.client_secret,
        ephemeralKey: ephemeralKey.secret,
        redirectUrl: session.url
      }
    });
  } catch (err) {
    console.error('Stripe Identity Session Error:', err);
    return res.status(500).json({
      code: 500,
      message: 'Failed to create verification session',
      error: err.message,
      data: null
    });
  }
};

const checkVerificationStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.identity.verificationSessions.retrieve(sessionId);

    return res.status(200).json({
      code: 200,
      message: 'Verification session retrieved successfully',
      error: null,
      data: {
        sessionId: session.id,
        status: session.status,
        verifiedOutputs: session.verified_outputs
      }
    });
  } catch (err) {
    console.error('Check Verification Error:', err);
    return res.status(500).json({
      code: 500,
      message: 'Failed to retrieve verification status',
      error: err.message,
      data: null
    });
  }
};

module.exports = { createVerificationSession, checkVerificationStatus };
  
