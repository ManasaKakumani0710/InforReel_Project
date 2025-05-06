const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);


const allowedMethods = ['card','upi'];
const createCheckoutSession = async (req, res) => {
  try {
    const { amount, currency, productName, quantity, method } = req.body;

    if (!amount || !currency || !productName || !quantity) {
      return res.status(400).json({
        code: 400,
        message: "Failed",
        error: "Missing required fields",
        data: null
      });
    }

    const convertedAmount = Math.round(amount * 100);
    const allowedMethods = ['card']; // define allowed methods
    const methodType = allowedMethods.includes(method) ? method : 'card';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: [methodType],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: productName
            },
            unit_amount: convertedAmount
          },
          quantity: parseInt(quantity)
        }
      ],
      success_url: `${process.env.CLIENT_URL}/payment-success`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`
    });

    return res.status(200).json({
      code: 200,
      message: "Stripe session created successfully",
      error: null,
      data: { url: session.url }
    });

  } catch (err) {
    console.error('Stripe Checkout Error:', err);
    return res.status(500).json({
      code: 500,
      message: "Unable to create Stripe session",
      error: err.message,
      data: null
    });
  }
};
  
  
module.exports = { createCheckoutSession };
