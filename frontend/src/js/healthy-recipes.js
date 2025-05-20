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

    function checkCardVisibility() {
        const cards = document.querySelectorAll('.recipe-card:not(.visible)');
        const triggerBottom = window.innerHeight * 0.8;

        cards.forEach(card => {
            const cardTop = card.getBoundingClientRect().top;
            if (cardTop < triggerBottom) {
                card.classList.add('visible');
            }
        });
    }

    function displayRecipes(recipes) {
        recipeList.innerHTML = '';

        if (recipes.length === 0) {
            recipeList.innerHTML = '<p>No recipes found.</p>';
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'recipe-grid';

        recipes.forEach((recipe) => {
            const article = document.createElement('article');
            article.className = 'recipe-card'; // Make all cards visible initially
            const ingredients = recipe.ingredients || [];

            article.innerHTML = `
                <h3>${recipe.name}</h3>
                ${recipe.description ? 
                    `<p class="recipe-description">${recipe.description}</p>` 
                    : ''}
                <div class="ingredients-list">
                    <h4>Ingredients:</h4>
                    <ul>
                        ${ingredients.map(ing =>
                            `<li>${ing.name} (${ing.grams}g)</li>`
                        ).join('')}
                    </ul>
                </div>
                <button class="use-recipe-btn" data-recipe="${recipe.name}">
                    Use This Recipe
                </button>
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
                        } catch (err) {
                            skippedIngredients.push(ingredient.name);
                        }
                    }

                    if (addedCount > 0) {
                        // Fix: Use backticks for template literal, don't redeclare recipeName
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
                } finally {
                    btn.disabled = false;
                    btn.textContent = 'Use This Recipe';
                }
            });

            grid.appendChild(article);

            setTimeout(checkCardVisibility, 100);
        
            window.addEventListener('scroll', () => {
                requestAnimationFrame(checkCardVisibility);
            });
        });

        recipeList.appendChild(grid);
    }

    fetchRecipes();
});

document.addEventListener('beforeunload', () => {
    window.removeEventListener('scroll', checkCardVisibility);
});