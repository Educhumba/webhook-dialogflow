const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

app.post("/webhook", (req, res) => {
  const intent = req.body.queryResult.intent.displayName;
  const policies = req.body.queryResult.parameters.policy_type;

  const policyDescriptions = {
    motor: {
      text: "Motor insurance covers your vehicle against damage, theft, and third-party liability.",
      link: "https://www.ummainsurance.com/motor-insurance"
    },
    health: {
      text: "Health insurance helps you pay for medical expenses including hospitalization.",
      link: "https://www.ummainsurance.com/health-insurance"
    },
    family: {
      text: "Life insurance ensures your loved ones are financially protected after your death.",
      link: "https://www.ummainsurance.com/family-cover"
    },
    home: {
      text: "Home insurance protects your house and belongings against risks like fire, theft, or natural disasters.",
      link: "https://www.ummainsurance.com/home-insurance"
    },
    accident: {
      text: "Accident insurance provides coverage in case of accidental injuries or death.",
      link: "https://www.ummainsurance.com/personal-accident"
    },
    travel: {
      text: "Travel insurance covers medical and trip-related losses during your travels.",
      link: "https://www.ummainsurance.com/travel-insurance"
    },
    marine: {
      text: "Marine insurance covers loss or damage of ships, cargo, and transport.",
      link: "https://www.ummainsurance.com/marine-insurance"
    },
    aviation: {
      text: "Aviation insurance provides coverage for aircraft-related risks.",
      link: "https://www.ummainsurance.com/aviation-insurance"
    },
    industrial: {
      text: "Industrial insurance covers factories, equipment, and liability for industrial operations.",
      link: "https://www.ummainsurance.com/industrial-insurance"
    },
    index: {
      text: "Index insurance is based on a weather or production index rather than actual loss.",
      link: "https://www.ummainsurance.com/index-based-insurance"
    }
  };

  if (!policies || policies.length === 0) {
    res.json({
      fulfillmentMessages: [
        {
          text: {
            text: ["Please tell me which policy you want details about."]
          }
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
