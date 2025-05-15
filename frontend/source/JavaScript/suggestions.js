// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

//Fetch and filter ingredients as user types
const nameInput = document.getElementById("name");
const suggestionsList = document.getElementById("suggestions");

if (nameInput && suggestionsList) {
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
                suggestionsList.innerHTML = "";
            });
    });

    document.addEventListener('click', function (e) {
        if (!nameInput.contains(e.target) && !suggestionsList.contains(e.target)) {
            suggestionsList.innerHTML = "";
        }
    });
}
// Fetch and filter recipes as user types
const recipeSearchInput = document.getElementById("recipeSearchInput");
const recipeSuggestions = document.getElementById("recipeSuggestions");
let recipeListCache = [];

recipeSearchInput.addEventListener("input", function () {
    const query = recipeSearchInput.value.trim().toLowerCase();
    if (query.length < 3) {
        recipeSuggestions.innerHTML = "";
        return;
    }

    // Fetch recipe list only once and cache it
    if (recipeListCache.length === 0) {
        fetch(`${API_BASE}/list-recipes`)
            .then(res => res.json())
            .then(recipes => {
                recipeListCache = recipes;
                showRecipeSuggestions(query);
            })
            .catch(() => {
                recipeSuggestions.innerHTML = "<li>Error loading recipes.</li>";
            });
    } else {
        showRecipeSuggestions(query);
    }
});

// Show suggestions in the dropdown
function showRecipeSuggestions(query) {
    recipeSuggestions.innerHTML = "";
    const matches = recipeListCache.filter(r =>
        r.name.toLowerCase().includes(query) ||
        (r.description && r.description.toLowerCase().includes(query))
    ).slice(0, 7);

    if (matches.length === 0) {
        recipeSuggestions.innerHTML = "<li>No recipes found.</li>";
        return;
    }

    matches.forEach(recipe => {
        const li = document.createElement("li");
        // Use abbr tag to show description on hover
        li.innerHTML = recipe.description
            ? `<abbr title="${recipe.description}">${recipe.name}</abbr>`
            : recipe.name;

        li.addEventListener("click", async () => {
            recipeSearchInput.value = recipe.name;
            recipeSuggestions.innerHTML = "";

            try {
                await fetch(`${API_BASE}/reset`, { method: "DELETE" });
                const response = await fetch(`${API_BASE}/get-recipe?name=${encodeURIComponent(recipe.name)}`);
                const recipeDetails = await response.json();

                for (const ingredient of recipeDetails.ingredients) {
                    await fetch(`${API_BASE}/add-ingredient`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            name: ingredient.name,
                            grams: ingredient.grams
                        })
                    });
                }

                fetchIngredients();
                calculateTotal();

                window.location.href = "index.html";

            } catch (error) {
                alert("Error loading recipe: " + error.message);
            }
        });
        recipeSuggestions.appendChild(li);
    });
}

document.addEventListener('click', function(e) {
    if (!recipeSearchInput.contains(e.target) && !recipeSuggestions.contains(e.target)) {
        recipeSuggestions.innerHTML = "";
    }
});

//recipe suggestions
document.getElementById("suggestRecipesBtn").addEventListener("click", function()           {
    const suggestionsSection = document.getElementById("recipeSuggestionsSection");
    suggestionsSection.style.display = "block";

    fetch(`${API_BASE}/suggest-recipes`)
        .then(res => res.json())
        .then(suggestions => {
            const list = document.getElementById("recipeSuggestionsList");
            list.innerHTML = "";

            if (!suggestions.length) {
                list.innerHTML = "<li>No matching recipes found.</li>";
                return;
            }

            suggestions.sort((a, b) => {
                const percentA = (a.matches / a.total) * 100;
                const percentB = (b.matches / b.total) * 100;
                return percentB - percentA;
            });

            suggestions.forEach(s => {
                const percent = Math.round((s.matches / s.total) * 100);
                const li = document.createElement("li");

                li.innerHTML = `
            <div class="recipe-suggestion">
                <div>
                    ${s.description
                    ? `<abbr title="${s.description}"><strong>${s.name}</strong></abbr>`
                    : `<strong>${s.name}</strong>`}
                    <div>
                        <small>${percent}% match</small>
                        <abbr title="Required ingredients: ${s.ingredients.map(i => `${i.name} (${i.grams}g)`).join(', ')}">
                            <small>(${s.matches} of ${s.total} ingredients)</small>
                        </abbr>
                    </div>
                </div>
                <button class="use-recipe-btn">Use Recipe</button>
            </div>
        `;

                li.querySelector('.use-recipe-btn').addEventListener('click', async () => {
                    try {
                        await fetch(`${API_BASE}/reset`, { method: "DELETE" });
                        const response = await fetch(`${API_BASE}/get-recipe?name=${encodeURIComponent(s.name)}`);
                        const recipeDetails = await response.json();

                        for (const ingredient of recipeDetails.ingredients) {
                            await fetch(`${API_BASE}/add-ingredient`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    name: ingredient.name,
                                    grams: ingredient.grams
                                })
                            });
                        }

                        fetchIngredients();
                        calculateTotal();
                        suggestionsSection.style.display = "none";
                    } catch (error) {
                        alert("Error loading recipe: " + error.message);
                    }
                });

                list.appendChild(li);
            });
        });
});

function hideRecipeSuggestions() {
    document.getElementById("recipeSuggestionsSection").style.display = "none";
}