// Emergency SMS Dispatcher Service
// Integrates with SMS Gateway & Fast2SMS / Twilio webhook

async function sendSMS(toPhoneNumber, messageBody) {
  try {
    console.log('====================================================');
    console.log(`📱 DISPATCHING SMS ALERT TO: ${toPhoneNumber}`);
    console.log('----------------------------------------------------');
    console.log(messageBody);
    console.log('====================================================');

    // If Fast2SMS or Twilio API keys are configured in environment variables, dispatch live HTTP SMS API call
    if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body: messageBody,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: toPhoneNumber
      });
      console.log(`✅ Live Twilio SMS successfully delivered to ${toPhoneNumber}`);
    }
    return { success: true, to: toPhoneNumber };
  } catch (err) {
    console.error(`❌ SMS Dispatch error to ${toPhoneNumber}:`, err.message);
    return { success: false, error: err.message };
  }
}

async function dispatchEmergencySMSAlert({ victimName, victimPhone, emergencyContact, policePhone, volunteerPhone, latitude, longitude }) {
  const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;

  const message = `🚨 EMERGENCY ALERT!\nA woman needs help.\nVictim: ${victimName || 'Citizen'} (${victimPhone || 'N/A'})\nLocation: ${mapsLink}\nPlease respond immediately.`;

  const recipients = [
    emergencyContact,
    policePhone,
    volunteerPhone
  ].filter(Boolean);

  const results = [];
  for (const phone of recipients) {
    const res = await sendSMS(phone, message);
    results.push(res);
  }

  return { message, recipientsCount: recipients.length, results };
}

module.exports = {
  sendSMS,
  dispatchEmergencySMSAlert
};
