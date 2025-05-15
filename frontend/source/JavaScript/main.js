// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

document.getElementById("ingredientForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const grams = parseFloat(document.getElementById("grams").value);

    if (!name) {
        alert("Please enter an ingredient name.");
        return;
    }

    if (isNaN(grams) || grams <= 0) {
        alert("Please enter a valid weight in grams.");
        return;
    }

    fetchWithSession(`${API_BASE}/add-ingredient`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, grams })
    })
        .then(res => {
            if (!res.ok) {
                if (res.status === 404) throw new Error("Unknown ingredient!");
                throw new Error("Failed to add ingredient! Ingredient may have already been added!");
            }
            return res.json();
        })
        .then(data => {
            fetchIngredients();
            document.getElementById("name").value = "";
            document.getElementById("grams").value = "";
        })
        .catch(err => alert(err.message));
});

function fetchIngredients() {
    fetchWithSession(`${API_BASE}/ingredients`)
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById("ingredientList");
            list.innerHTML = "";
            data.forEach(ing => {
                const item = document.createElement("li");
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

function deleteIngredient(name) {
    fetchWithSession(`${API_BASE}/delete-ingredient?name=${encodeURIComponent(name)}`, {
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
        })
        .catch(error => {
            console.error('Delete error:', error);
            alert('Failed to delete ingredient');
        });
}

function calculateTotal() {
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
        .catch(err => {
            document.getElementById("totalOutput").textContent = "Error calculating total: " + err.message;
        });
}

function resetIngredients() {
    fetchWithSession(`${API_BASE}/reset`, { method: "DELETE"})
        .then(() => {
            fetchIngredients()
            document.getElementById("recipeSearchInput").value = "";
            document.getElementById("recipeSuggestionsSection").style.display = "none";
            document.getElementById("recipeSuggestionsList").innerHTML = "";
            document.getElementById("recipeSuggestions").innerHTML = "";
            document.getElementById("totalOutput").innerHTML=`Click "Calculate" to see total nutrition.`;
        })
        .catch(error => {
            console.error("Error resetting ingredients:", error);
            alert("Failed to reset ingredients");
        });
}

fetchIngredients();

