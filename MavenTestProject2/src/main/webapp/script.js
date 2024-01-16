document.addEventListener('DOMContentLoaded', function () {
    const searchForm = document.getElementById('searchForm');
    const map = L.map('map').setView([0, 0], 2);
    let birthplaceMarker;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    searchForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const celebrityName = document.getElementById('celebrityName').value;
        const formattedName = encodeURIComponent(getFormattedName(celebrityName));
        const nameInRightFormat = getFirstUpperCaseLetters(celebrityName);

        try {
            const response = await fetch(`/sparql?celebrityName=${formattedName}`);
            if (!response.ok) {
                throw new Error('Error fetching data');
            }
            const data = await response.json();
            console.log('Response data:', data);

            // Extract and format birth date
            const birthDateParts = data.birthDate ? data.birthDate.split('^^')[0] : null;
            const formattedBirthDate = birthDateParts
                ? new Date(birthDateParts).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : 'N/A';
            let spouseName = 'N/A';
            if (data.spouse) {
                const spouseParts = data.spouse.split('/').slice(-1)[0]; // Get the last part of the URL
                spouseName = decodeURIComponent(spouseParts.replace(/_/g, ' ')); // Replace underscores and decode URL
            }
            let birthName = 'N/A';
            if (data.birthName) {
                birthName = data.birthName.replace(/@en$/, '');
            }

            // Update UI with data
            const celebrityInfo = document.getElementById('celebrityInfo');
            celebrityInfo.innerHTML = `
                <h2>${nameInRightFormat}</h2>
                <p>Birth Name: ${birthName}</p>
                <p>Birth Date: ${formattedBirthDate}</p>
                <p>Spouse: ${spouseName}</p>
            `;

            // Clear previous marker
            if (birthplaceMarker) {
                map.removeLayer(birthplaceMarker);
            }

            // Add marker for birthplace
            if (data.locations.length > 0) {
                const coordinates = await fetchCoordinatesFromDBpedia(data.locations[0]);
                if (coordinates) {
                    const [lat, long] = coordinates.split('/');
                    birthplaceMarker = L.marker([parseFloat(lat), parseFloat(long)]).addTo(map);
                    map.setView([parseFloat(lat), parseFloat(long)], 8);
                }
            } else {
                map.setView([0, 0], 2);
            }

            // Fetch image URL from WikiData
            const wikiDataResponse = await fetch(`/wikidata?celebrityName=${nameInRightFormat}`);
            if (wikiDataResponse.ok) {
                const wikiData = await wikiDataResponse.json();
                console.log('WikiData response:', wikiData);

                // Retrieve and display the image
                if (wikiData.image) {
                    console.log('Retrieved image URL:', wikiData.image);

                    const celebrityImage = document.getElementById('celebrityImage');
                    celebrityImage.src = wikiData.image;
                    celebrityImage.style.display = 'block';
                }
            } else {
                console.error('Error fetching WikiData:', wikiDataResponse.statusText);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            const celebrityInfo = document.getElementById('celebrityInfo');
            celebrityInfo.innerHTML = '<p>Error fetching data.</p>';
            map.setView([0, 0], 2);
        }
    });

    function getFormattedName(name) {
        const nameParts = name.toLowerCase().split(' ');
        const formattedName = nameParts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('_');
        return formattedName;
    }

    function getFirstUpperCaseLetters(name) {
        const nameParts = name.toLowerCase().split(' ');
        const formattedName = nameParts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
        return formattedName;
    }

    async function fetchCoordinatesFromDBpedia(locationUri) {
        try {
            const sparqlQuery = `
            PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
            SELECT ?lat ?long
            WHERE {
                <${locationUri}> geo:lat ?lat ;
                                 geo:long ?long .
            }
        `;

            const response = await fetch(`http://dbpedia.org/sparql?query=${encodeURIComponent(sparqlQuery)}`, {
                headers: {
                    Accept: 'application/sparql-results+json',
                },
            });

            if (!response.ok) {
                throw new Error('Error fetching coordinates');
            }

            const jsonResult = await response.json();
            const bindings = jsonResult.results.bindings[0];

            console.log(jsonResult);
            console.log(bindings);

            if (bindings && bindings.lat && bindings.long) {
                return `${bindings.lat.value}/${bindings.long.value}`;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching coordinates:', error);
            return null;
        }
    }
});
