async function fetchAFLFixtures() {
    try {
        const response = await fetch("https://api.squiggle.com.au/?q=games;year=2025;round=NEXT");
        
        if (!response.ok) {
            throw new Error("API request failed.");
        }

        const data = await response.json();

        const fixtureList = document.getElementById("fixture-list");
        fixtureList.innerHTML = ""; // Clear previous content

        if (data.games && data.games.length > 0) {
            data.games.forEach(game => {
                const match = document.createElement("li");
                match.innerHTML = `<strong>${game.hteam} vs ${game.ateam}</strong> - ${new Date(game.date).toLocaleString()}`;
                fixtureList.appendChild(match);
            });
        } else {
            fixtureList.innerHTML = "No upcoming matches found.";
        }
    } catch (error) {
        console.error("Error fetching AFL fixtures:", error);
        document.getElementById("fixture-list").innerHTML = "Error loading fixtures.";
    }
}

// Run function when the page loads
fetchAFLFixtures();
