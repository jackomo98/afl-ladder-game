const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

let players = [];
const teams = [
    "Adelaide", "Brisbane", "Carlton", "Collingwood", "Essendon",
    "Fremantle", "Geelong", "Gold Coast", "GWS", "Hawthorn",
    "Melbourne", "North Melbourne", "Port Adelaide", "Richmond",
    "St Kilda", "Sydney", "West Coast", "Western Bulldogs"
];

// Load stored predictions if available
if (fs.existsSync("data.json")) {
    players = JSON.parse(fs.readFileSync("data.json", "utf8"));
}

// API to submit a prediction
app.post("/submit", (req, res) => {
    const { name, prediction } = req.body;

    if (!name || !prediction || prediction.length !== 18) {
        return res.status(400).json({ message: "Invalid data. Must have all 18 teams ranked." });
    }

    // Remove existing entry if the player already submitted
    players = players.filter((p) => p.name !== name);
    players.push({ name, prediction, points: 0 });

    fs.writeFileSync("data.json", JSON.stringify(players, null, 2));
    res.json({ message: "Prediction submitted successfully!" });
});

// API to fetch live AFL ladder
app.get("/live-ladder", async (req, res) => {
    try {
        const response = await axios.get("https://api.squiggle.com.au/?q=standings", {
            headers: {
                "User-Agent": "AFL-Ladder-Tipping/1.0 (Contact: your-email@example.com)"
            }
        });
        res.json(response.data.standings || []);
    } catch (error) {
        console.error("Error fetching live AFL ladder:", error);
        res.status(500).json({ message: "Error fetching live ladder" });
    }
});

// API to calculate leaderboard scores based on real AFL ladder
app.get("/leaderboard", async (req, res) => {
    try {
        const response = await axios.get("https://api.squiggle.com.au/?q=standings", {
            headers: {
                "User-Agent": "AFL-Ladder-Tipping/1.0 (Contact: your-email@example.com)"
            }
        });
        const actualLadder = response.data.standings;

        // Calculate points for each player
        players.forEach(player => {
            let score = 0;
            player.prediction.forEach((predictedPos, index) => {
                const actualPos = actualLadder.find(team => team.name === teams[index])?.rank || 18;
                score += Math.abs(predictedPos - actualPos);
            });
            player.points = score;
        });

        // Sort leaderboard (lowest points = best rank)
        players.sort((a, b) => a.points - b.points);

        res.json(players);
    } catch (error) {
        console.error("Error calculating leaderboard:", error);
        res.status(500).json({ message: "Error calculating leaderboard" });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));