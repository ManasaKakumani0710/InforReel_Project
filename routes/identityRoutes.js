const express = require("express");
const router = express.Router();
const {
  createVerificationSession,
  checkVerificationStatus,
} = require("../controllers/identityController");

router.post("/create-session", createVerificationSession);
router.get("/check-status/:sessionId", checkVerificationStatus);

router.get("/api/identity-complete", async (req, res) => {
  const { session_id } = req.query;

  if (!session_id) {
    return res.redirect(
      `${process.env.FRONTEND_FAILURE_URL}?status=failed&message=Missing session ID`
    );
  }

  try {
    const session = await stripe.identity.verificationSessions.retrieve(
      session_id
    );

    if (session.status === "verified") {
      // Verified — redirect to frontend success page
      return res.redirect(
        `${process.env.FRONTEND_SUCCESS_URL}?status=success&message=Verification successful`
      );
    } else {
      // Not verified — redirect to frontend failure page
      return res.redirect(
        `${process.env.FRONTEND_FAILURE_URL}?status=failed&message=Not verified your profile.Please Verify ${session.status}`
      );
    }
  } catch (err) {
    console.error("Stripe Redirect Error:", err.message);
    return res.redirect(
      `${process.env.FRONTEND_FAILURE_URL}?status=error&message=Server error`
    );
  }
});

module.exports = router;
