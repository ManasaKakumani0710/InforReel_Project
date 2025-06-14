const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const Stripe = require("stripe");
const path = require("path");
const connectDB = require("./config/dbconfig");

// Route imports
const userRoutes = require("./routes/userRoutes");
const identityRoutes = require("./routes/identityRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const interestsRoutes = require("./routes/interestsRoutes");
const postRoutes = require("./routes/postRoutes");
const productRoutes = require('./routes/productRoutes');
const downloadRoutes = require('./routes/download');


dotenv.config();
const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
connectDB();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploads/posts", express.static(path.join(__dirname, "uploads/posts")));
app.use("uploads/Products", express.static(path.join(__dirname, "uploads/Products")));

// Route registrations
app.use("/api/users", userRoutes);
app.use("/api/identity", identityRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/interests", interestsRoutes);
app.use("/api/posts", postRoutes);
app.use('/api/products', productRoutes);

app.use('/api/files', downloadRoutes);

// Password Reset Route
app.get("/reset-password", (req, res) => {
  const { token } = req.query;
  res.json({ message: "Please provide a new password.", token });
});

// Stripe Identity Session Creation
app.post("/create-session", async (req, res) => {
  try {
    const { userId, fullName, email, userType, dob, gender, ssn, address } = req.body;

    if (userType !== "vendor") {
      return res.status(403).json({
        code: 403,
        message: "Identity verification is only required for vendors.",
        error: "Unauthorized user type",
        data: null,
      });
    }

    const session = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: {
        user_id: userId,
        full_name: fullName,
        email,
        dob,
        gender,
        ssn_last_4: ssn,
        address: JSON.stringify(address),
      },
      return_url: process.env.FRONTEND_FAILURE_URL,
    });

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { verification_session: session.id },
      { apiVersion: "2025-04-30.basil" }
    );

    res.status(200).json({
      code: 200,
      message: "Verification session created",
      error: null,
      data: {
        sessionId: session.id,
        clientSecret: session.client_secret,
        ephemeralKey: ephemeralKey.secret,
        redirectUrl: session.url,
      },
    });
  } catch (err) {
    console.error("Stripe session error:", err);
    res.status(500).json({
      code: 500,
      message: "Stripe error",
      error: err.message,
      data: null,
    });
  }
});

// Stripe Verification Completion
app.get("/identity-complete", async (req, res) => {
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({
      status: "failed",
      message: "Missing session ID",
      redirectUrl: process.env.FRONTEND_FAILURE_URL,
    });
  }

  try {
    const session = await stripe.identity.verificationSessions.retrieve(session_id);

    if (session.status === "verified") {
      return res.status(200).json({
        status: "verified",
        redirectUrl: `${process.env.FRONTEND_SUCCESS_URL}?status=success&message=Verification successful`,
      });
    } else {
      return res.status(200).json({
        status: session.status,
        redirectUrl: `${process.env.FRONTEND_FAILURE_URL}?status=failed&message=Verification ${session.status}`,
      });
    }
  } catch (err) {
    console.error("Stripe Redirect Error:", err.message);
    return res.status(500).json({
      status: "error",
      message: "Server error",
      redirectUrl: `${process.env.FRONTEND_FAILURE_URL}?status=error&message=Server error`,
    });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
