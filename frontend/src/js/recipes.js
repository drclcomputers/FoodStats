// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

document.getElementById("saveRecipeForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const nameInput = document.getElementById("recipeName");
    const descInput = document.getElementById("recipeDescription");
    const saveBtn = e.submitter || document.querySelector("#saveRecipeForm button[type='submit']");

    const recipeName = nameInput.value.trim();
    const recipeDescription = descInput.value.trim();

    if (!recipeName) {
        showToast("Please enter a recipe name.");
        return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    document.getElementById("saveRecipeForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        const nameInput = document.getElementById("recipeName");
        const descInput = document.getElementById("recipeDescription");
        const saveBtn = e.submitter || document.querySelector("#saveRecipeForm button[type='submit']");

        const recipeName = nameInput.value.trim();
        const recipeDescription = descInput.value.trim();

        if (!recipeName) {
            showToast("Please enter a recipe name.");
            return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";

        try {
            const res = await fetchWithSession(`${API_BASE}/ingredients`);
            const ingredients = await res.json();

            if (!Array.isArray(ingredients) || ingredients.length === 0) {
                showToast("No ingredients to save!");
                return;
            }

            const recipeIngredients = ingredients.map(ing => ({
                name: ing.name,
                grams: ing.grams
            }));

            const addRes = await fetchWithSession(`${API_BASE}/add-recipe`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    name: recipeName,
                    description: recipeDescription,
                    ingredients: recipeIngredients
                })
            });

            if (!addRes.ok) {
                const msg = addRes.status === 409
                    ? "A recipe with that name already exists!"
                    : "Failed to save recipe!";
                throw new Error(msg);
            }

            showToast("Recipe saved!");
            nameInput.value = "";
            descInput.value = "";
        } catch (error) {
            console.error("Save error:", error);
            showToast(error.message || "Error saving recipe!");
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = "Save Recipe";
        }
    });
});