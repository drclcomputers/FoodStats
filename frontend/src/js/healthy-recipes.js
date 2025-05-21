// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

document.addEventListener('DOMContentLoaded', () => {
    const recipeList = document.getElementById('recipeList');
    const filterInput = document.getElementById('recipeFilterInput');
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

    function isVegan(recipe) {
        return recipe.vegan === true;
    }

    function applyFiltersAndDisplay() {
        let filtered = allRecipes;

        const ingredientQuery = ingredientFilterInput ? ingredientFilterInput.value.trim().toLowerCase() : '';
        if (ingredientQuery) {
            filtered = filtered.filter(recipe =>
                (recipe.ingredients || []).some(ing =>
                    ing.name.toLowerCase().includes(ingredientQuery)
                )
            );
        }

        if (veganFilterCheckbox && veganFilterCheckbox.checked) {
            filtered = filtered.filter(isVegan);
        }

        displayRecipes(filtered);
    }

    if (ingredientFilterInput) {
        ingredientFilterInput.addEventListener('input', applyFiltersAndDisplay);
    }
    if (veganFilterCheckbox) {
        veganFilterCheckbox.addEventListener('change', applyFiltersAndDisplay);
    }

    function checkCardVisibility() {
        const cards = document.querySelectorAll(".recipe-card:not(.visible)");
        if (cards.length === 0) {
            if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
            return;
        }
        const triggerBottom = window.innerHeight * 0.8;

        cards.forEach((card) => {
            const cardTop = card.getBoundingClientRect().top;
            if (cardTop < triggerBottom) {
            card.classList.add("visible");
            }
        });
    }

    function displayRecipes(recipes) {
        recipeList.innerHTML = '';

        if (recipes.length === 0) {
            recipeList.innerHTML = '<p id="RecipesNotFound">No recipes found.</p>';
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
                <button class="use-recipe-btn" data-recipe="${recipe.name.replace(
                /"/g,
                "&quot;"
                )}">Use Recipe</button>
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
                }
                catch (error) {
                    const toasts = JSON.parse(localStorage.getItem('toasts') || '[]');
                    toasts.push({ message: 'No ingredients could be added', timestamp: Date.now() });
                    localStorage.setItem('toasts', JSON.stringify(toasts));
                    window.location.href = 'index.html';
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


        scrollHandler = () => {
          requestAnimationFrame(checkCardVisibility);
        };

        setTimeout(() => {
          checkCardVisibility();
          window.addEventListener("scroll", scrollHandler);
        }, 100); 
    }

    fetchRecipes();
});

document.addEventListener('beforeunload', () => {
    window.removeEventListener('scroll', checkCardVisibility);
});