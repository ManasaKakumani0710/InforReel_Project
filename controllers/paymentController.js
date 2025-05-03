const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);


const allowedMethods = ['card','upi'];
const createCheckoutSession = async (req, res) => {
    try {
      const { amount, currency, productName, quantity, method } = req.body;
  
      if (!amount || !currency || !productName || !quantity) {
        return res.status(400).json({ message: "Missing required fields" });
      }
  
      const convertedAmount = Math.round(amount * 100);
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
  
      res.status(200).json({ url: session.url });
    } catch (err) {
      console.error('Stripe Checkout Error:', err);
      res.status(500).json({ message: 'Unable to create Stripe session' });
    }
  };
  
  
module.exports = { createCheckoutSession };
