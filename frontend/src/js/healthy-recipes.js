// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

document.addEventListener('DOMContentLoaded', () => {
    const recipeList = document.getElementById('recipeList');
    let allRecipes = [];

    async function fetchRecipes() {
        try {
            const response = await fetchWithSession(`${API_BASE}/listrecipes`);
            const recipes = await response.json();
            allRecipes = recipes;
            showToast(`Loaded ${recipes.length} recipes`);
            displayRecipes(recipes);
        } catch (error) {
            recipeList.innerHTML = '<p class="error">Error loading recipes. Please try again later.</p>';
            showToast('Failed to load recipes.');
            console.error('Error fetching recipes:', error);
        }
    }

    function displayRecipes(recipes) {
        recipeList.innerHTML = '';

        if (recipes.length === 0) {
            recipeList.innerHTML = '<p>No recipes found.</p>';
            return;
        }

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        grid.style.gap = '20px';
        grid.style.padding = '20px';
        grid.style.maxWidth = '1200px';
        grid.style.margin = '0 auto';

        recipes.forEach((recipe, index) => {
            const article = document.createElement('article');
            article.className = 'recipe-card';
            const ingredients = recipe.ingredients || [];

            if (index < 2) {
                article.classList.add('initial-visible');
            }

            article.innerHTML = `
                <h2 style="text-align: center">${recipe.name}</h2>
                ${recipe.description
                ? `<p class="description" style="text-align: center">
                        <abbr title="${recipe.description}">${recipe.description.substring(0, 100)}${recipe.description.length > 100 ? '...' : ''}</abbr>
                       </p>`
                : ''}
                <ul style="margin: 15px 0">
                    ${ingredients.map(ing =>
                `<li>${ing.name} (${ing.grams}g)</li>`
            ).join('')}
                </ul>
                <div style="text-align: center">
                    <button class="use-recipe-btn" data-recipe="${recipe.name}">
                        Use This Recipe
                    </button>
                </div>
            `;

            article.querySelector('.use-recipe-btn').addEventListener('click', async (e) => {
                const recipeName = e.target.dataset.recipe;
                const btn = e.target;
                btn.disabled = true;
                btn.textContent = 'Loading...';

                try {
                    await fetchWithSession(`${API_BASE}/reset`, { method: "DELETE"});

                    const response = await fetchWithSession(`${API_BASE}/getrecipe?name=${encodeURIComponent(recipeName)}`);
                    if (!response.ok) {
                        throw new Error('Failed to get recipe');
                    }
                    const recipeDetails = await response.json();

                    let addedCount = 0;
                    let skippedIngredients = [];

                    // Try to add each ingredient, but continue if one fails
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

                            if (ingResponse.ok) {
                                addedCount++;
                            } else {
                                skippedIngredients.push(ingredient.name);
                            }
                        } catch (ingError) {
                            skippedIngredients.push(ingredient.name);
                            continue;
                        }
                    }

                    if (addedCount > 0) {
                        localStorage.setItem('currentRecipe', `📗 ${recipeName}`);
                        if (skippedIngredients.length > 0) {
                            showToast(`Added ${addedCount} ingredients. Skipped: ${skippedIngredients.slice(0,2).join(', ')}${skippedIngredients.length > 2 ? '...' : ''}`);
                        }
                        window.location.href = 'index.html';
                    } else {
                        showToast('No ingredients could be added');
                    }
                }
                catch (error) {
                    console.error('Recipe loading error:', error);
                    showToast("Error loading recipe!");
                    btn.disabled = false;
                    btn.textContent = 'Use This Recipe';
                }
            });

            grid.appendChild(article);

            window.addEventListener('scroll', checkCardVisibility);
            checkCardVisibility()
        });

        recipeList.appendChild(grid);
    }

    fetchRecipes();
});

function checkCardVisibility() {
    const cards = document.querySelectorAll('.recipe-card:not(.initial-visible)');
    const windowHeight = window.innerHeight;

    cards.forEach(card => {
        const cardTop = card.getBoundingClientRect().top;
        if (cardTop < windowHeight * 0.8) {
            card.classList.add('visible');
        }
    });
}

document.addEventListener('beforeunload', () => {
    window.removeEventListener('scroll', checkCardVisibility);
});