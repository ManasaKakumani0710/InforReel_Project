const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Payment = require("../models/payment");
const User = require("../models/users"); // if needed

const createCheckoutSession = async (req, res) => {
  try {
    const { user_id, amount, currency, productName, quantity, method } =
      req.body;

    if (!amount || !currency || !productName || !quantity || !user_id) {
      return res.status(400).json({
        code: 400,
        message: "Failed",
        error: "Missing required fields",
        data: null,
      });
    }

    const convertedAmount = Math.round(amount * 100);
    const methodType = method || "card"; // fallback to card

    const session = await stripe.checkout.sessions.create({
      payment_method_types: [
        "card",
        "upi",
        "paypal",
        "afterpay_clearpay",
        "klarna",
        "us_bank_account",
      ], // Add more if needed
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: productName,
            },
            unit_amount: convertedAmount,
          },
          quantity: parseInt(quantity),
        },
      ],
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
      metadata: {
        userId: user_id,
        productName,
        quantity,
        method: methodType,
      },
    });

    // Save to DB with status "pending"
    await Payment.create({
      userId: user_id,
      sessionId: session.id,
      productName,
      amount,
      currency,
      quantity,
      method: methodType,
      status: "pending",
    });

    return res.status(200).json({
      code: 200,
      message: "Stripe session created successfully",
      error: null,
      data: { url: session.url },
    });
  } catch (err) {
    console.error("Stripe Checkout Error:", err);
    return res.status(500).json({
      code: 500,
      message: "Unable to create Stripe session",
      error: err.message,
      data: null,
    });
  }
};

module.exports = { createCheckoutSession };
