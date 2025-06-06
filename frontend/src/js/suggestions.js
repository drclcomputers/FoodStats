// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

class SuggestionsManager {
    constructor() {
        this.nameInput = document.getElementById("name");
        this.suggestionsList = document.getElementById("suggestions");
        this.recipeSearchInput = document.getElementById("recipeSearchInput");
        this.recipeSuggestions = document.getElementById("recipeSuggestions");
        this.recipeListCache = [];
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Ingredient suggestions
        if (this.nameInput && this.suggestionsList) {
            this.nameInput.addEventListener("input", () => this.handleIngredientInput());
            document.addEventListener('click', (e) => this.handleClickOutside(e));
        }

        // Recipe suggestions
        if (this.recipeSearchInput) {
            this.recipeSearchInput.addEventListener("input", () => this.handleRecipeInput());
            document.addEventListener('click', (e) => this.handleRecipeClickOutside(e));
        }
    }

    async handleIngredientInput() {
        const query = this.nameInput.value.trim();

        if (query.length < 1) {
            this.hideSuggestions(this.suggestionsList);
            return;
        }

        try {
            const response = await fetchWithSession(`${API_BASE}/suggestions?query=${encodeURIComponent(query)}`);
            const data = await response.json();
            this.displayIngredientSuggestions(data);
        } catch (error) {
            console.error("Error fetching suggestions:", error);
            this.suggestionsList.innerHTML = "";
        }
    }

    displayIngredientSuggestions(suggestions) {
        this.suggestionsList.innerHTML = "";
        
        if (suggestions.length > 0) {
            suggestions.forEach(suggestion => {
                const li = document.createElement("li");
                li.textContent = suggestion;
                li.addEventListener("click", () => this.selectIngredient(suggestion));
                this.suggestionsList.appendChild(li);
            });
            this.showSuggestions(this.suggestionsList);
        } else {
            this.hideSuggestions(this.suggestionsList);
        }
    }

    async handleRecipeInput() {
        const query = this.recipeSearchInput.value.trim().toLowerCase();
        
        if (query.length < 2) {
            this.hideSuggestions(this.recipeSuggestions);
            return;
        }

        if (this.recipeListCache.length === 0) {
            try {
                const response = await fetchWithSession(`${API_BASE}/listrecipes`);
                this.recipeListCache = await response.json();
                this.showRecipeSuggestions(query);
            } catch (error) {
                this.recipeSuggestions.innerHTML = "<li>Error loading recipes.</li>";
            }
        } else {
            this.showRecipeSuggestions(query);
        }
    }

    filterRecipes(query) {
        query = query.trim().toLowerCase();
        if (!query) return this.recipeListCache;
        return this.recipeListCache.filter(recipe => {
            const nameMatch = recipe.name.toLowerCase().includes(query);
            //const ingredientMatch = (recipe.ingredients || []).some(ing =>
                //ing.name.toLowerCase().includes(query)
            //);
            return nameMatch
        });
    }

    showRecipeSuggestions(query) {
        const matches = this.filterRecipes(query);

        this.recipeSuggestions.innerHTML = matches.length > 0 
            ? matches.slice(0, 5).map(recipe => `
                <li class="recipe-suggestion-item" data-recipe="${recipe.name}">
                    <div class="recipe-suggestion">
                        <div class="recipe-info">
                            ${this.formatRecipeTitle(recipe)}
                            ${this.formatRecipeDetails(recipe)}
                        </div>
                    </div>
                </li>
            `).join('')
            : '<li>No matching recipes found.</li>';

        this.showSuggestions(this.recipeSuggestions);
        this.attachRecipeEventListeners();
    }

    formatRecipeTitle(recipe) {
        return recipe.description 
            ? `<abbr title="${recipe.description}"><strong>${recipe.name}</strong></abbr>`
            : `<strong>${recipe.name}</strong>`;
    }

    formatRecipeDetails(recipe) {
        return `<small>${recipe.ingredients.length} ingredients</small>`;
    }

    showSuggestions(element) {
        element.style.display = 'block';
        element.classList.remove('hiding');
        element.classList.add('showing');
    }

    hideSuggestions(element) {
        if (!element || !element.innerHTML || element.style.display === "none")
        return;

        element.classList.remove("showing");
        element.classList.add("hiding");

        const onAnimationEnd = () => {
        element.style.display = "none";
        element.classList.remove("hiding");
        };

        element.addEventListener("animationend", onAnimationEnd, { once: true });

        setTimeout(() => {
        if (element.classList.contains("hiding")) {
            console.warn(
            "Suggestion hide animationend event timed out or did not fire. Hiding manually.",
            element
            );
            onAnimationEnd();
        }
        }, 350);
    }

    handleClickOutside(e) {
        if (!this.nameInput.contains(e.target) && !this.suggestionsList.contains(e.target)) {
            this.hideSuggestions(this.suggestionsList);
        }
    }

    handleRecipeClickOutside(e) {
        if (!this.recipeSearchInput.contains(e.target) && !this.recipeSuggestions.contains(e.target)) {
            this.hideSuggestions(this.recipeSuggestions);
        }
    }

    selectIngredient(suggestion) {
        this.nameInput.value = suggestion;
        this.hideSuggestions(this.suggestionsList);
        document.getElementById("grams")?.focus();
    }

    attachRecipeEventListeners() {
        this.recipeSuggestions.querySelectorAll('.recipe-suggestion-item').forEach(item => {
            item.addEventListener('click', () => this.useRecipe(item.dataset.recipe));
        });
    }

    async useRecipe(recipeName) {
        if (window.aiManager && typeof window.aiManager.loadRecipe === "function") {
            try {
                await window.aiManager.loadRecipe(recipeName);
                this.hideSuggestions(this.recipeSuggestions);
            } catch (error) {
                console.error("Error delegating recipe load to AIManager:", error);
                showToast("Failed to initiate recipe loading via AI Manager.");
            }
        } else {
            console.error(
                "AIManager or AIManager.loadRecipe is not available. Cannot use recipe."
            );
            throw new error("Recipe loading functionality is currently unavailable.");
        }

            try {
                await fetchWithSession(`${API_BASE}/reset`, { method: "DELETE" });
                const response = await fetchWithSession(`${API_BASE}/getrecipe?name=${encodeURIComponent(recipeName)}`);
                const recipe = await response.json();

                let addedCount = 0;
                let skippedIngredients = [];
                for (const ingredient of recipe.ingredients) {
                    try {
                        const res = await fetchWithSession(`${API_BASE}/addingredient`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                name: ingredient.name,
                                grams: ingredient.grams
                            })
                        });
                        if (res.ok) {
                            addedCount++;
                        } else {
                            skippedIngredients.push(ingredient.name);
                        }
                    } catch (err) {
                        console.error('Error adding ingredient:', err);
                        skippedIngredients.push(ingredient.name);
                    }
                }

                if (addedCount > 0) {
                    localStorage.setItem('currentRecipe', `📗 ${recipeName}`);
                    const toasts = JSON.parse(localStorage.getItem('toasts') || '[]');

                    if (skippedIngredients.length > 0) {
                        toasts.push({ message: `Added ${addedCount} ingredients. Skipped: ${skippedIngredients.slice(0,2).join(', ')}${skippedIngredients.length > 2 ? '...' : ''}`, timestamp: Date.now() });
                    }
                    else {
                        toasts.push({ message: `Added ${addedCount} ingredients.`, timestamp: Date.now() });
                    }
                            
                    localStorage.setItem('toasts', JSON.stringify(toasts));
                    window.location.href = 'index.html';
                } else {
                    showToast('No ingredients could be added');
                }
            } catch (error) {
                const toasts = JSON.parse(localStorage.getItem('toasts') || '[]');
                toasts.push({ message: 'No ingredients could be added', timestamp: Date.now() });
                localStorage.setItem('toasts', JSON.stringify(toasts));
                window.location.href = 'index.html';
            }
        }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    new SuggestionsManager();
});