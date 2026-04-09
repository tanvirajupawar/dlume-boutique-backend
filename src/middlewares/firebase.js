// Firebase temporarily disabled for demo

let admin = null;

try {
  admin = require("firebase-admin");

  // Do NOT initialize (since no key)
  console.log("Firebase disabled (no service account)");
} catch (err) {
  console.log("Firebase module not loaded");
}

module.exports = admin;