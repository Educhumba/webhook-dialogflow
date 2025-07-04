const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());
//connecting to googlesheet for chats logging
const { google } = require('googleapis');
const moment = require('moment-timezone');
const fs = require('fs');
const { type } = require("os");
const { title } = require("process");
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

    const time = moment().tz('Africa/Nairobi').format('YYYY-MM-DD HH:mm:ss');
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
app.post("/webhook", async (req, res) => {
  const intent = req.body.queryResult.intent.displayName;
  const policies = req.body.queryResult.parameters.policy_type;
  const userText = req.body.queryResult.queryText;
  const Human_Agent_context= "waiting_human_agent_decision";
  //logging intents not understood by the bot to google sheets
  if (intent === "Default Fallback Intent"){
    const botReply = "I am sorry, I didn't quite understand what you said. Please rephrase or Do you want to speak to a human agent?";
    await appendToSheet(userText, botReply, intent);
    return res.json({
      fulfillmentMessages:[
        {
          text:{text:[botReply]}
        },{payload:{richContent:[[{
          type:"chips",
          options:[
            {text:"Yes"},
            {text:"No"}
          ]
        }]]}}
      ],
    });
  }
  // Handle YES after fallback
  if (intent === "Default Fallback Intent - yes") {
    const botReply = `Or Call us on: +254775444777.\nYou can also request a call on our website.`;
    await appendToSheet(userText, "User agreed to speak to a human agent", intent);
    return res.json({
      fulfillmentMessages: [
        {
          payload: {
            richContent: [[
              {
                type: "info",
                title: "Chat on WhatsApp",
                subtitle: "Click to chat on WhatsApp",
                actionLink: "https://wa.me/254110146704"
              }
            ]]
          }
        },
        {
          text: { text: [botReply] }
        }
      ]
    });
  }
  // Handle NO after fallback
  if (intent === "Default Fallback Intent - no") {
    const botReply = "Thank you. Is there anything else I can help you with?";
    await appendToSheet(userText, "User declined human assistance", intent);
    return res.json({
      fulfillmentMessages: [
        {
          text: { text: [botReply] }
        }
      ],
    });
  }
  // human agent request
  if (intent == "Talk to human"){
    const botReply=`Or Call us on:+254775444777.\n You can also request a call on our website`;
    await appendToSheet(req.body.queryResult.queryText, "Requested Human Agent", intent)
    return res.json({fulfillmentMessages:[{
      payload:{richContent:[[{
        type: "info",
        title:"Chat on WhatsApp",
        subtitle:"Click to chat on whatsapp",
        actionLink: "https://wa.me/254110146704"
      }]]}
    },{
      text:{text:[botReply]}
    }]});
  }
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
  // checking the requested policy type and return its details
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
          subtitle: `I don't have info on "${policy}".`
        });
      }
    });
    const matchedPolicies = keysToShow.filter(p=>policyDescriptions[p]);
    const botReply = `Sent ${matchedPolicies.length} policy description(s): [${matchedPolicies.join(', ')}]`;
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