document.getElementById("searchButton").addEventListener("click", function() {
    const celebrityName = document.getElementById("celebrityName").value;

    fetch("sparql", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        body: "celebrityName=" + encodeURIComponent(celebrityName)
    })
        .then(response => response.json())
        .then(data => {
            // Process the data and display the map with the locations
            displayMap(data);
        })
        .catch(error => {
            console.error("Error fetching data:", error);
        });
});

function displayMap(data) {
    // Use a mapping library (e.g., Leaflet, Google Maps) to display the map and locations
    // For simplicity, here's a placeholder example:
    const mapDiv = document.getElementById("map");
    mapDiv.innerHTML = "<p>Map will be displayed here.</p>";
}
