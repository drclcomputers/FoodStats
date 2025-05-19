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
            suggestionsList.classList.add('hiding');
            setTimeout(() => {
                suggestionsList.innerHTML = '';
                suggestionsList.classList.remove('hiding');
                suggestionsList.style.display = 'none';
            }, 800);
            return;
        }

        suggestionsList.style.display = 'block';
        suggestionsList.classList.remove('hiding');

        fetchWithSession(`${API_BASE}/suggestions?query=${encodeURIComponent(query)}`)
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

                if (data.length) {
                    suggestionsList.style.display = "block";
                } else {
                    suggestionsList.style.display = "none";
                }
            })
            .catch(err => {
                console.error("Error fetching suggestions:", err);
                suggestionsList.innerHTML = "";
            });
    });

    document.addEventListener('click', function(e) {
        if (!recipeSearchInput.contains(e.target) && !recipeSuggestions.contains(e.target)) {
            if (recipeSuggestions.innerHTML !== '') {
                recipeSuggestions.classList.remove('showing');
                recipeSuggestions.classList.add('hiding');
                setTimeout(() => {
                    recipeSuggestions.style.display = 'none';
                    recipeSuggestions.classList.remove('hiding');
                }, 800);
            }
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

    if (recipeListCache.length === 0) {
        fetchWithSession(`${API_BASE}/listrecipes`)
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
        li.innerHTML = recipe.description
            ? `<abbr title="${recipe.description}">${recipe.name}</abbr>`
            : recipe.name;

        li.addEventListener("click", async () => {
            recipeSearchInput.value = recipe.name;
            recipeSuggestions.innerHTML = "";

            try {
                await fetchWithSession(`${API_BASE}/reset`, { method: "DELETE"});
                const response = await fetchWithSession(`${API_BASE}/getrecipe?name=${encodeURIComponent(recipe.name)}`);
                const recipeDetails = await response.json();

                let hasError = false;
                for (const ingredient of recipeDetails.ingredients) {
                    try {
                        const ingResponse = await fetchWithSession(`${API_BASE}/addingredient`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                name: ingredient.name,
                                grams: ingredient.grams
                            })
                        });

                        if (!ingResponse.ok) {
                            showToast(`Failed to add: ${ingredient.name}`);
                            hasError = true;
                            continue;
                        }
                    } catch (err) {
                        showToast(`Error adding: ${ingredient.name}`);
                        hasError = true;
                        continue;
                    }
                }

                localStorage.setItem('currentRecipe', `📗 ${recipe.name}`);

                if (!hasError) {
                    window.location.href = "index.html";
                } else {
                    showToast('Some ingredients could not be added');
                }
            } catch (error) {
                showToast('Failed to load recipe');
            }
        });
        recipeSuggestions.appendChild(li);
    });

    recipeSuggestions.style.display = 'block';
    recipeSuggestions.classList.remove('hiding');
    recipeSuggestions.classList.add('showing');
}

function hideRecipeSuggestions() {
    const suggestionsSection = document.getElementById("recipeSuggestionsSection");
    hideSuggestions(suggestionsSection);
}

document.addEventListener('click', function(e) {
    if (!nameInput.contains(e.target) && !suggestionsList.contains(e.target)) {
        if (suggestionsList.innerHTML !== '') {
            suggestionsList.classList.add('hiding');
            setTimeout(() => {
                suggestionsList.innerHTML = '';
                suggestionsList.classList.remove('hiding');
                suggestionsList.style.display = 'none';
            }, 800);
        }
    }
});

//recipe suggestions
document.getElementById("suggestRecipesBtn").addEventListener("click", function() {
    const suggestionsSection = document.getElementById("recipeSuggestionsSection");
    showSuggestions(suggestionsSection);

    fetchWithSession(`${API_BASE}/suggestrecipes`)
        .then(res => res.json())
        .then(suggestions => {
            const list = document.getElementById("recipeSuggestionsList");
            list.innerHTML = "";

            if (!Array.isArray(suggestions) || suggestions.length === 0) {
                showToast("No matching recipes found");
                list.innerHTML = '<li class="no-results">No recommendations found.</li>';
                return;
            }

            showToast(`Found ${suggestions.length} matching recipes`);

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
                        await fetchWithSession(`${API_BASE}/reset`, { method: "DELETE" });
                        const response = await fetchWithSession(`${API_BASE}/getrecipe?name=${encodeURIComponent(s.name)}`);
                        const recipeDetails = await response.json();

                        for (const ingredient of recipeDetails.ingredients) {
                            await fetchWithSession(`${API_BASE}/addingredient`, {
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
                        showToast('Failed to load recipe');
                    }
                });

                list.appendChild(li);
            });
        })
        .catch(() => {
            const list = document.getElementById("recipeSuggestionsList");
            list.innerHTML = "<li>Error loading recommendations.</li>";
        });
});

document.addEventListener('DOMContentLoaded', function() {
    const recipeSearchForm = document.getElementById('recipeSearchForm');
    if (recipeSearchForm) {
        recipeSearchForm.addEventListener('submit', function(e) {
            e.preventDefault();
        });
    }
});

// Animations for Suggestions List
function showSuggestions(element) {
    element.style.display = 'block';
    element.classList.remove('hiding');
    element.classList.add('showing');
}

function hideSuggestions(element) {
    if (!element || !element.innerHTML) return;

    element.classList.remove('showing');
    element.classList.add('hiding');

    setTimeout(() => {
        if (element.classList.contains('hiding')) {
            element.style.display = 'none';
            element.classList.remove('hiding');
        }
    }, 800);
}

