const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/dbconfig");
const userRoutes = require("./routes/userRoutes");
const identityRoutes = require("./routes/identityRoutes");
const payments = require("./routes/paymentRoutes");
const interests = require("./routes/interestsRoutes");
const Stripe = require("stripe");

dotenv.config();
const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
connectDB();

app.use(cors());

app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/identity", identityRoutes);
app.use("/api/payments", payments);
app.use("/api", interests);

app.get("/reset-password", (req, res) => {
  const { token } = req.query;
  res.json({ message: "Please provide a new password.", token });
});

app.post("/create-session", async (req, res) => {
  try {
    const { userId, fullName, email, userType, dob, gender, ssn, address } =
      req.body;

    if (userType !== "vendor") {
      return res.status(403).json({
        code: 403,
        message: "Identity verification is only required for vendors.",
        error: "Unauthorized user type",
        data: null,
      });
    }

    // Step 1: Create initial session (no return_url yet)
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
    const session = await stripe.identity.verificationSessions.retrieve(
      session_id
    );

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
// insertStaticInterests();

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
