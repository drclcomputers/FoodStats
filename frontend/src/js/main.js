// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

document.getElementById("ingredientForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const nameInput = document.getElementById("name");
    const gramsInput = document.getElementById("grams");
    const name = nameInput.value.trim().toLowerCase();
    const grams = parseFloat(gramsInput.value);

    nameInput.classList.remove('input-error');
    gramsInput.classList.remove('input-error');

    if (!name) {
        nameInput.classList.add('input-error');
        showToast("Please enter an ingredient name.");
        return;
    }

    if (isNaN(grams) || grams <= 0) {
        gramsInput.classList.add('input-error');
        showToast("Please enter a valid weight in grams.");
        return;
    }

    fetchWithSession(`${API_BASE}/addingredient`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, grams })
    })
        .then(res => {
            if (!res.ok) {
                if (res.status === 404) throw new Error("Unknown ingredient!");
                showToast("Failed to add ingredient! Ingredient may have already been added!");
            }
            return res.json();
        })
        .then(data => {
            fetchIngredients();
            document.getElementById("name").value = "";
            document.getElementById("grams").value = "";
            nameInput.classList.remove('input-error');
            gramsInput.classList.remove('input-error');
        })
        .catch(error => {
            nameInput.classList.add('input-error');
            showToast('Failed to add ingredient! Invalid ingredient!');
        });
});

document.getElementById("name").addEventListener("input", function() {
    this.classList.remove('input-error');
});

document.getElementById("grams").addEventListener("input", function() {
    this.classList.remove('input-error');
});

function fetchIngredients() {
    fetchWithSession(`${API_BASE}/ingredients`)
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById("ingredientList");
            list.innerHTML = "";
            data.forEach(ing => {
                const item = document.createElement("li");
                item.setAttribute('data-name', ing.name);
                item.textContent = `${ing.name} (${ing.grams}g): ` +
                    `${ing.calories.toFixed(1)} kcal, ` +
                    `${ing.proteins.toFixed(1)}g protein, ` +
                    `${ing.carbs.toFixed(1)}g carbs, ` +
                    `${ing.fats.toFixed(1)}g fat, ` +
                    `${ing.fiber.toFixed(1)}g fiber`;

                const deleteBtn = document.createElement("button");
                deleteBtn.textContent = "🗑️";
                deleteBtn.style.marginLeft = "10px";
                deleteBtn.onclick = () => deleteIngredient(ing.name);

                item.appendChild(deleteBtn);
                list.appendChild(item);
            });
        });
}

function updateRecipeSource(source) {
    const sourceElement = document.getElementById('recipeSource');
    sourceElement.textContent = source ? ` - ${source}` : '';
}

function deleteIngredient(name) {
    const item = document.querySelector(`#ingredientList li[data-name="${name}"]`);
    item.classList.add('removing');

    setTimeout(() => {
        fetchWithSession(`${API_BASE}/deleteingredient?name=${encodeURIComponent(name)}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete ingredient');
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
            fetchIngredients();
            updateRecipeSource('')
            localStorage.removeItem('currentRecipe');
            showToast(`Removed ${name}`);
        })
        .catch(error => {
            console.error('Delete error:', error);
            showToast('Failed to delete ingredient');
            item.classList.remove('removing');
        });
    }, 300);
}

function calculateTotal() {
    const btn = document.querySelector('button[onclick="calculateTotal()"]');
    const originalText = btn.textContent;

    const spinner = document.createElement('div');
    spinner.className = 'loading';
    btn.textContent = '';
    btn.appendChild(spinner);
    btn.disabled = true;

    fetchWithSession(`${API_BASE}/calculate`)
        .then(res => res.json())
        .then(data => {
            const output = `
${data.name} (${data.grams}g):
- ${data.calories.toFixed(1)} kcal
- ${data.proteins.toFixed(1)}g protein
- ${data.carbs.toFixed(1)}g carbs
- ${data.fats.toFixed(1)}g fat
- ${data.fiber.toFixed(1)}g fiber
            `.trim();

            document.getElementById("totalOutput").textContent = output;
        })
        .finally(() => {
            btn.removeChild(spinner);
            btn.textContent = 'Calculate';
            btn.disabled = false;
        })
        .catch(err => {
            document.getElementById("totalOutput").textContent = "Error calculating total: " + err.message;
        });

    showToast("Nutrition calculated");
}

function resetIngredients() {
    const list = document.getElementById("ingredientList");
    list.classList.add('reset-animation');

    setTimeout(() => {
        fetchWithSession(`${API_BASE}/reset`, { method: "DELETE"})
        .then(() => {
            fetchIngredients()
            updateRecipeSource('');
            showToast("All ingredients cleared");
            localStorage.removeItem('currentRecipe');
            document.getElementById("recipeSearchInput").value = "";
            document.getElementById("recipeSuggestionsSection").style.display = "none";
            document.getElementById("recipeSuggestionsList").innerHTML = "";
            document.getElementById("recipeSuggestions").innerHTML = "";
            document.getElementById("totalOutput").innerHTML=`Click "Calculate" to see total nutrition.`;
        })
        .catch(() => {
            showToast('Failed to clear list');
        });
    }, 250);
}

document.addEventListener('DOMContentLoaded', () => {
    const savedRecipe = localStorage.getItem('currentRecipe');
    if (savedRecipe) {
        updateRecipeSource(savedRecipe);
    }
});

// Enter - submit
document.getElementById("ingredientForm").addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        if (e.target.tagName === "INPUT") {
            e.preventDefault();
            this.requestSubmit();
        }
    }
});

// Ctrl+I - Ingredient
document.addEventListener("keydown", function(e) {
    if (e.ctrlKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        document.getElementById("name").focus();
    }
});

// Ctrl+G - Grams
document.addEventListener("keydown", function(e) {
    if (e.ctrlKey && e.key.toLowerCase() === "g") {
        e.preventDefault();
        document.getElementById("grams").focus();
    }
});

// Ctrl + T - Reset, Ctrl + A - calculate
document.addEventListener("keydown", function(e) {
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        resetIngredients();
    } else if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        calculateTotal();
    }
});

// Ctrl + U - Export Recipe. Ctrl + O - Import Recipe
document.addEventListener("keydown", function(e) {
    if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        document.getElementById('exportBtn').click();
    } else if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        document.getElementById('importBtn').click();
    }
});

// Ctrl + S - Search Recipes, Ctrl + H - Go Home
document.addEventListener("keydown", function(e) {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        document.getElementById('recipeSearchInput').focus();
    } else if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        window.location.href = 'index.html';
    }
});

// Import/Export Recipes
document.getElementById('exportBtn').addEventListener('click', async () => {
    try {
        const response = await fetchWithSession(`${API_BASE}/ingredients`);
        const ingredients = await response.json();

        if (ingredients.length === 0) {
            showToast("No ingredients to export");
            return;
        }

        const exportData = ingredients.map(ing => ({
            name: ing.name,
            grams: ing.grams
        }));

        const blob = new Blob([JSON.stringify(exportData, null, 2)],
            {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ingredients_${new Date().toLocaleDateString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("Recipe exported successfully");
    } catch (error) {
        showToast('Failed to export ingredients');
    }
});

document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importInput').click();
});

document.getElementById('importInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        const ingredients = JSON.parse(text);

        if (!Array.isArray(ingredients)) {
            showToast('Invalid format');
            return
        }

        await fetchWithSession(`${API_BASE}/reset`, { method: "DELETE" });

        for (const ing of ingredients) {
            await fetchWithSession(`${API_BASE}/addingredient`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: ing.name,
                    grams: ing.grams
                })
            });
        }

        const filename = file.name.replace(/\.[^/.]+$/, "");
        updateRecipeSource(`📄 ${filename}`);

        fetchIngredients();
        calculateTotal();
        e.target.value = '';
        showToast(`Imported ingredients from ${file.name}`);
    } catch (error) {
        showToast('Failed to import ingredients');
    }
});

fetchIngredients();