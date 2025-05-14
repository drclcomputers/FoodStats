const nameInput = document.getElementById("name");
const suggestionsList = document.getElementById("suggestions");
const API_BASE = process.env.NODE_ENV === 'production'
    ? 'https://foodstats.railway.app/api'
    : 'http://localhost:8080/api';

nameInput.addEventListener("input", function () {
    const query = nameInput.value.trim();

    if (query.length < 1) {
        suggestionsList.innerHTML = "";
        return;
    }

    fetch(`${API_BASE}/suggestions?query=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
            suggestionsList.innerHTML = "";

            data.forEach(suggestion => {
                const li = document.createElement("li");
                li.textContent = suggestion;
                li.addEventListener("click", () => {
                    nameInput.value = suggestion;
                    suggestionsList.innerHTML = "";
                });
                suggestionsList.appendChild(li);
            });
        })
        .catch(err => {
            console.error("Error fetching suggestions:", err);
        });
});
