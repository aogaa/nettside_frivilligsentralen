const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const {defineSecret} = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

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

// Gyldige datoer for leksehjelp host 2026 (stengte hostferie-datoer utelatt).
const LEKSEHJELP_DATOER = {
  mandag: new Set([
    "2026-08-31", "2026-09-07", "2026-09-14", "2026-09-21",
    "2026-10-05", "2026-10-12", "2026-10-19", "2026-10-26",
    "2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23", "2026-11-30",
    "2026-12-07", "2026-12-14",
  ]),
  onsdag: new Set([
    "2026-09-02", "2026-09-09", "2026-09-16", "2026-09-23",
    "2026-10-07", "2026-10-14", "2026-10-21", "2026-10-28",
    "2026-11-04", "2026-11-11", "2026-11-18", "2026-11-25",
    "2026-12-02", "2026-12-09", "2026-12-16",
  ]),
};

const LEKSEHJELP_FELTER = {
  mandag: ["barn", "voksenopplaering", "frivillige"],
  onsdag: ["elever", "frivillige"],
};

function toCount(value) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.min(n, 999);
}

// Gyldige datoer for spraakkafe host 2026 (alle tirsdager, ingen hostferiepause).
const SPRAKKAFE_DATOER = new Set([
  "2026-09-01", "2026-09-08", "2026-09-15", "2026-09-22", "2026-09-29",
  "2026-10-06", "2026-10-13", "2026-10-20", "2026-10-27",
  "2026-11-03", "2026-11-10", "2026-11-17", "2026-11-24",
  "2026-12-01", "2026-12-08", "2026-12-15",
]);

const SPRAKKAFE_FELTER = ["deltakere", "bord", "frivillige"];

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

// Etter kontrollert migrering skal gamle klienter ikke kunne bekrefte nye
// Firebase-skrivinger. Nyhetsbrevfunksjonen over er uendret.
function movedAttendance(req, res) {
  res.status(410).json({
    ok: false,
    error: "Oppmøteregistreringen er flyttet. Last nettsiden på nytt og logg inn.",
    url: "https://frivilligsentralen.org/",
  });
}
exports.leksehjelp = onRequest({cors: allowedOrigins, invoker: "public"}, movedAttendance);
exports.sprakkafe = onRequest({cors: allowedOrigins, invoker: "public"}, movedAttendance);
