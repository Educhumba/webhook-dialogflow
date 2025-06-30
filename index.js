const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());
//connecting to googlesheet for chats logging
const { google } = require('googleapis');
const moment = require('moment');
const fs = require('fs');
// logging to google sheets
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SHEET_ID = '1Psmc91dm3_iLFIltVnoadcAWSUu74lFtFwqXG_aNvTw';
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
  scopes: SCOPES,
});
async function appendToSheet(userText, botReply, intentName) {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const time = moment().format('YYYY-MM-DD HH:mm:ss');
    const row = [[time, userText, botReply, intentName]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:D',
      valueInputOption: 'RAW',
      resource: { values: row },
    });

    console.log("Logged to Google Sheets:", row);
  } catch (err) {
    console.error("Failed to log to Google Sheets:", err.message);
  }
}
// checking the requested policy type and return its details
app.post("/webhook", async (req, res) => {
  const intent = req.body.queryResult.intent.displayName;
  const policies = req.body.queryResult.parameters.policy_type;
  const userText = req.body.queryResult.queryText;
  const policyDescriptions = {
    motor: {
      text: "Motor insurance covers your vehicle against damage, theft, and third-party liability.(Click to view more)",
      link: "https://www.ummainsurance.com/motor-insurance"
    },
    health: {
      text: "Health insurance helps you pay for medical expenses including hospitalization.(Click to view more)",
      link: "https://www.ummainsurance.com/health-insurance"
    },
    family: {
      text: "Life insurance ensures your loved ones are financially protected after your death.(Click to view more)",
      link: "https://www.ummainsurance.com/family-cover"
    },
    home: {
      text: "Home insurance protects your house and belongings against risks like fire, theft, or natural disasters.(Click to view more)",
      link: "https://www.ummainsurance.com/home-insurance"
    },
    accident: {
      text: "Accident insurance provides coverage in case of accidental injuries or death.(Click to view more)",
      link: "https://www.ummainsurance.com/personal-accident"
    },
    travel: {
      text: "Travel insurance covers medical and trip-related losses during your travels.(Click to view more)",
      link: "https://www.ummainsurance.com/travel-insurance"
    },
    marine: {
      text: "Marine insurance covers loss or damage of ships, cargo, and transport.(Click to view more)",
      link: "https://www.ummainsurance.com/marine-insurance"
    },
    aviation: {
      text: "Aviation insurance provides coverage for aircraft-related risks.(Click to view more)",
      link: "https://www.ummainsurance.com/aviation-insurance"
    },
    industrial: {
      text: "Industrial insurance covers factories, equipment, and liability for industrial operations.(Click to view more)",
      link: "https://www.ummainsurance.com/industrial-insurance"
    },
    index: {
      text: "Index insurance is based on a weather or production index rather than actual loss.(Click to view more)",
      link: "https://www.ummainsurance.com/index-based-insurance"
    }
  };
  if (intent === "Default Fallback Intent"){
    const botReply = "I am sorry, I didn't quite understand what you said. Please rephrase";
    await appendToSheet(userText, botReply, intent);
    return res.json({
      fulfillmentMessages:[
        {
          text:{text:[botReply]}
        }
      ]
    });
  }
  if (!policies || policies.length === 0) {
    const botReply = "Please tell me which policy you want details about.";
    await appendToSheet(userText, botReply, intent);
    res.json({
      fulfillmentMessages: [
        {
          text: { text: [botReply] }
        }
      ]
    });
  } else {
    const richCards = [];
    const keysToShow = policies.includes("all")
      ? Object.keys(policyDescriptions)
      : policies.map(p => p.toLowerCase());
    keysToShow.forEach((policy) => {
      const info = policyDescriptions[policy];
      if (info) {
        richCards.push({
          type: "info",
          title: policy.toUpperCase(),
          subtitle: info.text,
          actionLink: info.link
        });
      } else {
        richCards.push({
          type: "info",
          title: policy.toUpperCase(),
          subtitle: `⚠️ I don't have info on "${policy}".`
        });
      }
    });
    const botReply = `Sent ${keysToShow.length} policy description(s)`;
    await appendToSheet(userText, botReply, intent);
    res.json({
      fulfillmentMessages: [
        {
          payload: {
            richContent: [richCards]
          }
        }
      ]
    });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));