// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

document.getElementById("saveRecipeForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const recipeName = document.getElementById("recipeName").value.trim();
    const recipeDescription = document.getElementById("recipeDescription").value.trim();

    if (!recipeName) {
        showToast("Please enter a recipe name.");
        return;
    }

    // fetch current ingredients from the backend
    fetchWithSession(`${API_BASE}/ingredients`)
        .then(res => res.json())
        .then(ingredients => {
            if (!ingredients.length) {
                showToast("No ingredients to save!");
                return;
            }

            // Prepare ingredients for the API (only name and grams)
            const recipeIngredients = ingredients.map(ing => ({
                name: ing.name,
                grams: ing.grams
            }));

            // Send to backend
            fetchWithSession(`${API_BASE}/add-recipe`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: recipeName,
                    description: recipeDescription,
                    ingredients: recipeIngredients
                })
            })
                .then(res => {
                    if (!res.ok) throw new Error("Failed to save recipe (maybe duplicate name?)");
                    return res.json();
                })
                .then(() => {
                    showToast("Recipe saved!");
                    document.getElementById("recipeName").value = "";
                    document.getElementById("recipeDescription").value = "";
                })
                .catch(err => showToast("Error saving recipe!"));
        });
});