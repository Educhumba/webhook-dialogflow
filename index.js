const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

app.post("/webhook", (req, res) => {
  const intent = req.body.queryResult.intent.displayName;
  const policies = req.body.queryResult.parameters.policy_types;

  const policyDescriptions = {
    motor: "Motor insurance covers your vehicle against damage, theft, and third-party liability.",
    health: "Health insurance helps you pay for medical expenses including hospitalization.",
    fire: "Fire insurance protects your property against fire-related damage.",
    life: "Life insurance ensures your loved ones are financially protected after your death.",
  };

  let reply = "";

  if (!policies || policies.length === 0) {
    reply = "Please tell me which policy you want details about.";
  } else if (policies.includes("all")) {
    for (const key in policyDescriptions) {
      reply += `🔹 ${key}: ${policyDescriptions[key]}\n\n`;
    }
  } else {
    policies.forEach((policy) => {
      if (policyDescriptions[policy.toLowerCase()]) {
        reply += `🔹 ${policy}: ${policyDescriptions[policy.toLowerCase()]}\n\n`;
      } else {
        reply += `⚠️ I don't have info on "${policy}".\n\n`;
      }
    });
  }

  res.json({ fulfillmentText: reply.trim() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
