// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

document.addEventListener('DOMContentLoaded', () => {
    const recipeList = document.getElementById('recipeList');
    let allRecipes = [];

    function fetchRecipes() {
        fetch(`${API_BASE}/list-recipes`)
            .then(res => res.json())
            .then(recipes => {
                allRecipes = recipes;
                displayRecipes(recipes);
            })
            .catch(error => {
                recipeList.innerHTML = '<p class="error">Error loading recipes. Please try again later.</p>';
                console.error('Error:', error);
            });
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

        recipes.forEach(recipe => {
            const article = document.createElement('article');
            article.className = 'recipe-card';
            const ingredients = recipe.ingredients || [];

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
                    await fetch(`${API_BASE}/reset`, { method: "DELETE" });
                    const response = await fetch(`${API_BASE}/get-recipe?name=${encodeURIComponent(recipeName)}`);
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
                    window.location.href = 'index.html';
                } catch (error) {
                    alert("Error loading recipe: " + error.message);
                    btn.disabled = false;
                    btn.textContent = 'Use This Recipe';
                }
            });

            grid.appendChild(article);
        });

        recipeList.appendChild(grid);
    }

    // Initial load
    fetchRecipes();
});