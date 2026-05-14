const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const {defineSecret} = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

const n8nNewsletterUrl = defineSecret("N8N_NEWSLETTER_URL");
const n8nNewsletterToken = defineSecret("N8N_NEWSLETTER_TOKEN");

setGlobalOptions({
  region: "europe-west1",
  maxInstances: 5,
});

const allowedOrigins = [
  "https://frivilligsentralen.org",
  "https://www.frivilligsentralen.org",
];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

exports.newsletterSignup = onRequest(
    {
      cors: allowedOrigins,
      invoker: "public",
      secrets: [n8nNewsletterUrl, n8nNewsletterToken],
    },
    async (req, res) => {
      if (req.method !== "POST") {
        res.status(405).json({error: "Method not allowed"});
        return;
      }

      const {email, website} = req.body || {};

      if (website) {
        logger.info("Newsletter signup rejected by honeypot");
        res.status(200).json({ok: true});
        return;
      }

      if (typeof email !== "string" || !isValidEmail(email.trim())) {
        res.status(400).json({error: "Invalid email"});
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();

      try {
        const response = await fetch(n8nNewsletterUrl.value(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-newsletter-token": n8nNewsletterToken.value(),
          },
          body: JSON.stringify({email: normalizedEmail}),
        });

        if (!response.ok) {
          logger.error("n8n newsletter webhook failed", {
            status: response.status,
          });
          res.status(502).json({error: "Signup failed"});
          return;
        }

        res.status(200).json({ok: true});
      } catch (error) {
        logger.error("Newsletter signup proxy error", {
          message: error.message,
        });
        res.status(502).json({error: "Signup failed"});
      }
    },
);
