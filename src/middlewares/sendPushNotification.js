const admin = require("./firebase");

const sendPushNotification = async (token, title, body, data = {}) => {
  try {
    // ✅ If Firebase is disabled, skip safely
    if (!admin || !admin.messaging) {
      console.log("⚠️ Firebase not configured, skipping push notification");
      return;
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
      },
      token,
    };

    const response = await admin.messaging().send(message);
    console.log("✅ Push sent:", response);
    return response;
  } catch (error) {
    console.error("❌ Push error:", error.message);
  }
};

module.exports = sendPushNotification;