import { correct, Grammarly } from "@stewartmcgown/grammarly-api";
import express from "express";
import cors from "cors";
import path from "path"; // Add this import for working with file paths

const app = express();

// Set up EJS as the view engine
app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views")); // Specify the directory for your views
app.set('views', './views')
app.use(cors());

const getRequiredDetailsFromGrammarly = (response) => {
  const alerts = response.alerts.map((alert) => {
    const {
      title,
      minicardTitle,
      result,
      details,
      explanation,
      todo,
      text,
      cardLayout: { group },
    } = alert;
    return {
      title: cleanOutput(title),
      minicardTitle: cleanOutput(minicardTitle),
      result: cleanOutput(result),
      details: cleanOutput(details),
      explanation: cleanOutput(explanation),
      todo: cleanOutput(todo),
      text: cleanOutput(text),
      group: cleanOutput(group),
    };
  });
  const { score, outcomeScores, generalScore } = response.result;
  const { corrected } = response;
  return {
    alerts,
    score: { score, outcomeScores, generalScore },
    corrected,
  };
};

const cleanOutput = (inputQuery) => {
  const newLineRegEx = /\r?\n|\r/;
  const htmlRegEx = /(<([^>]+)>)/gi;
  const removeSpace = /\u00a0/g;
  const removeWhiteSpace = /\s+/g;
  const removeExtra = (query) =>
    query
      .replace(newLineRegEx, " ")
      .replace(htmlRegEx, " ")
      .replace(removeSpace, " ")
      .replace(removeWhiteSpace, " ")
      .trim();
  return inputQuery ? removeExtra(inputQuery) : inputQuery;
};

app.get("/api/v2/check", async function (req, res) {
  try {
    const grammarly = new Grammarly();
    // const grammarly = new Grammarly({
    //   auth: {
    //     grauth:
    //       "AABJH9lc281M9dT-n67og-TL61sgtqFMAUHLDRowzlgmjw0k8hg4Z12Z-D1Telx26ZoNwkog1V0YwB2j",
    //     "csrf-token": "AABJH1NwM0PyotrfdTxHxwUZRiZZzXrEbl/aBg",
    //   },
    // });
    const { text } = req.query;
    if (text.length > 0) {
      const results = await grammarly.analyse(text).then(correct);
      const finalResults = getRequiredDetailsFromGrammarly(results);
      res.status(200).send(finalResults);
    } else {
      res.status(200).send([]);
    }
  } catch (error) {
    res.status(404).send("Error! Something is really wrong.");
  }
});

app.get("/api/v1/check", async function (req, res) {
  try {
    const grammarly = new Grammarly();
    // const grammarly = new Grammarly({
    //   auth: {
    //     grauth:
    //       "AABJH9lc281M9dT-n67og-TL61sgtqFMAUHLDRowzlgmjw0k8hg4Z12Z-D1Telx26ZoNwkog1V0YwB2j",
    //     "csrf-token": "AABJH1NwM0PyotrfdTxHxwUZRiZZzXrEbl/aBg",
    //   },
    // });
    const { text } = req.query;
    if (text.length > 0) {
      const results = await grammarly.analyse(text).then(correct);
      const finalResults = getRequiredDetailsFromGrammarly(results);
      res.status(200).send(finalResults);
    } else {
      res.status(200).send([]);
    }
  } catch (error) {
    res.status(404).send("Error! Something is really wrong.");
  }
});


// app.get("/api/v3/check", async function (req, res) {
//   const grammarly = new Grammarly();
//   try {
//       const { text } = req.query;
//       if (text.length > 0) {
//           const results = await grammarly.analyse(text).then(correct);
//           const finalResults = getRequiredDetailsFromGrammarly(results);
//           res.json(finalResults); // Send JSON response
//       } else {
//           res.status(400).json({ error: "Text parameter is missing." });
//       }
//   } catch (error) {
//       console.error("Error:", error);
//       res.status(500).json({ error: "An error occurred while processing the request." });
//   }
// });
const grammarly = new Grammarly();

app.get("/api/v3/check", async function (req, res) {
  try {
    const { text } = req.query;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Text parameter is missing or empty." });
    }

    // Check cache here (if implemented) and return cached result if available

    const results = await grammarly.analyse(text);
    const correctedResults = correct(results);
    const finalResults = getRequiredDetailsFromGrammarly(correctedResults);

    // Store in cache here (if implemented)

    res.json(finalResults); // Send JSON response
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred while processing the request." });
  }
});

// Add a centralized error handling middleware
app.use(function (err, req, res, next) {
  console.error("Unhandled Error:", err);
  res.status(500).json({ error: "An unexpected error occurred." });
});


app.get("/", (req, res) => {
  res.render("index", { results: null }); // Render the EJS template with optional results data
});

app.get("/hello", (req, res) =>
  res.status(200).send("Welcome to Jaynil's Grammar Checker!")
);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Grammar Checker Running on ${port}`);
});
