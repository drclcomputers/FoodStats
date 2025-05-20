// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

class IngredientManager {
    constructor() {
        this.form = document.getElementById("ingredientForm");
        this.nameInput = document.getElementById("name");
        this.gramsInput = document.getElementById("grams");
        this.ingredientList = document.getElementById("ingredientList");
        this.totalOutput = document.getElementById("totalOutput");
        
        this.calculateBtn = document.getElementById("calculateBtn");
        this.resetBtn = document.getElementById("resetBtn");
        this.exportBtn = document.getElementById("exportBtn");
        this.importBtn = document.getElementById("importBtn");
        this.importInput = document.getElementById("importInput");

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Form submissions
        this.form?.addEventListener("submit", (e) => this.handleAddIngredient(e));
        
        // Input validations
        this.nameInput?.addEventListener("input", () => this.clearError(this.nameInput));
        this.gramsInput?.addEventListener("input", () => this.clearError(this.gramsInput));
        
        // Button listeners
        this.calculateBtn?.addEventListener('click', () => this.calculateTotal());
        this.resetBtn?.addEventListener('click', () => this.resetIngredients());
        this.exportBtn?.addEventListener('click', () => this.exportIngredients());
        this.importBtn?.addEventListener('click', () => this.importInput?.click());
        this.importInput?.addEventListener('change', (e) => this.importIngredients(e));
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
        document.addEventListener("keydown", (e) => {
            if (e.ctrlKey) {
                switch(e.key.toLowerCase()) {
                    case 'i': 
                        e.preventDefault();
                        this.nameInput.focus();
                        break;
                    case 'g':
                        e.preventDefault();
                        this.gramsInput.focus();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.resetIngredients();
                        break;
                    case 'a':
                        e.preventDefault();
                        this.calculateTotal();
                        break;
                }
            }
        });
    }

    async exportIngredients() {
        try {
            const ingredients = await fetchWithSession(`${API_BASE}/ingredients`).then(r => r.json());
            const blob = new Blob([JSON.stringify(ingredients, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ingredients.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Ingredients exported successfully');
        } catch (error) {
            showToast('Failed to export ingredients');
            console.error('Export error:', error);
        }
    }

    async importIngredients(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const content = await file.text();
            const ingredients = JSON.parse(content);

            // First reset current ingredients
            await fetchWithSession(`${API_BASE}/reset`, { method: 'DELETE' });

            let addedCount = 0;
            for (const ing of ingredients) {
                try {
                    const response = await fetchWithSession(`${API_BASE}/addingredient`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: ing.name,
                            grams: ing.grams
                        })
                    });
                    if (response.ok) addedCount++;
                } catch (err) {
                    console.error('Error adding ingredient:', err);
                }
            }

            await this.fetchIngredients();
            showToast(`Imported ${addedCount} ingredients`);
            e.target.value = ''; // Reset file input
        } catch (error) {
            showToast('Failed to import ingredients');
            console.error('Import error:', error);
        }
    }

    async showAiSuggestions() {
        const aiSection = document.getElementById('aiAnalysisSection');
        const container = document.getElementById('aiSmartSuggestions');
        
        aiSection.style.display = 'block';
        container.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div>Loading suggestions...</div>';

        try {
            const ingredients = await fetchWithSession(`${API_BASE}/ingredients`).then(r => r.json());
            const names = ingredients.map(i => i.name);
            
            const res = await fetchWithSession(`${API_BASE}/smartrecommendations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ingredients: names })
            });
            
            const recommendations = await res.json();
            
            if (!recommendations.length) {
                container.innerHTML = '<div>No smart suggestions found.</div>';
                return;
            }

            container.innerHTML = `
                <div class="recipe-grid">
                    ${recommendations.map(recipe => `
                        <div class="recipe-card">
                            <h4>${recipe.name}</h4>
                            <p>${recipe.description || ''}</p>
                            <div class="match-score">${
                                recipe.similarity !== undefined 
                                    ? Math.round(recipe.similarity * 100) + '% match'
                                    : ''
                            }</div>
                            <button onclick="useRecipe('${recipe.name.replace(/'/g, "\\'")}')">Use Recipe</button>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (err) {
            container.innerHTML = '<div>Error loading smart suggestions.</div>';
            showToast('Failed to load AI suggestions');
        }
    }

    async handleAddIngredient(e) {
        e.preventDefault();
        
        const name = this.nameInput.value.trim().toLowerCase();
        const grams = parseFloat(this.gramsInput.value);

        if (!this.validateInputs(name, grams)) return;

        try {
            const response = await this.addIngredient(name, grams);
            if (response.ok) {
                this.clearInputs();
                await this.fetchIngredients();
            } else {
                throw new Error(response.status === 404 ? "Unknown ingredient!" : "Ingredient already added!");
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    validateInputs(name, grams) {
        this.clearErrors();

        if (!name) {
            this.showError(this.nameInput, "Please enter an ingredient name.");
            return false;
        }

        if (isNaN(grams) || grams <= 0) {
            this.showError(this.gramsInput, "Please enter a valid weight in grams.");
            return false;
        }

        return true;
    }

    async addIngredient(name, grams) {
        return await fetchWithSession(`${API_BASE}/addingredient`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, grams })
        });
    }

    async fetchIngredients() {
        console.log(localStorage.getItem('currentRecipe'));
        try {
            const response = await fetchWithSession(`${API_BASE}/ingredients`);
            const data = await response.json();
            
            const list = document.getElementById("ingredientList");
            list.innerHTML = "";

            const savedRecipe = localStorage.getItem('currentRecipe');
            this.updateRecipeSource(savedRecipe || '');

            if (!data || data.length === 0) {
                const emptyMessage = document.createElement("li");
                emptyMessage.className = "empty-message";
                emptyMessage.textContent = "No ingredients added yet";
                list.appendChild(emptyMessage);
                document.getElementById("totalOutput").textContent = "Click \"Calculate\" to see total nutrition.";
                return;
            }

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
                deleteBtn.onclick = () => this.deleteIngredient(ing.name);

                item.appendChild(deleteBtn);
                list.appendChild(item);
            });
        } catch (error) {
            console.error('Error fetching ingredients:', error);
            showToast('Failed to load ingredients');
        }
    }

    updateRecipeSource(source) {
        const sourceElement = document.getElementById('recipeSource');
        if (sourceElement) {
            sourceElement.innerHTML = source ? ` - <span style="color: #2b6777">${source}</span>` : '';
        }
    }

    async deleteIngredient(name) {
        const item = document.querySelector(`#ingredientList li[data-name="${name}"]`);
        item.classList.add('removing');

        setTimeout(async () => {
        try {
            const response = await fetchWithSession(`${API_BASE}/deleteingredient?name=${encodeURIComponent(name)}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete ingredient');
            await this.fetchIngredients();

            // Only clear recipe source if ingredient list is now empty
            const ingredients = await fetchWithSession(`${API_BASE}/ingredients`).then(r => r.json());
            if (!ingredients || ingredients.length === 0) {
                this.updateRecipeSource('');
                localStorage.setItem('currentRecipe', '');
            }
            showToast(`Removed ${name}`);
        } catch (error) {
            console.error('Delete error:', error);
            showToast('Failed to delete ingredient');
            item.classList.remove('removing');
        }
    }, 300);
    }

    async calculateTotal() {
        const btn = this.calculateBtn;
        if (!btn) return;
        const originalText = btn.textContent;

        const spinner = document.createElement('div');
        spinner.className = 'loading';
        btn.textContent = 'Calculating...';
        btn.appendChild(spinner);
        btn.disabled = true;

        try {
            const res = await fetchWithSession(`${API_BASE}/calculate`);
            const data = await res.json();

            let html = `
                <strong>Calories:</strong> ${data.calories.toFixed(1)} kcal<br>
                <strong>Proteins:</strong> ${data.proteins.toFixed(1)}g<br>
                <strong>Carbs:</strong> ${data.carbs.toFixed(1)}g<br>
                <strong>Fats:</strong> ${data.fats.toFixed(1)}g<br>
                <strong>Fiber:</strong> ${data.fiber.toFixed(1)}g<br>
            `;

            const ingredients = await fetchWithSession(`${API_BASE}/ingredients`).then(r => r.json());
            const aiRes = await fetchWithSession(`${API_BASE}/analyzenutrition`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ingredients)
            });
            const analysis = await aiRes.json();

            html += `
                <hr>
                <div style="margin-top:10px;">
                    <strong>AI Health Score:</strong>
                    <span style="display:inline-block; width:40px; height:40px; border-radius:50%; background:#2b6777; color:white; line-height:40px; text-align:center; font-weight:bold;">
                        ${Math.round(analysis.health_score)}
                    </span>
                    <br>
                    <strong>AI Recommendations:</strong>
                    <ul style="margin:8px 0 0 20px; text-align:left;">
                        ${analysis.recommendations.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                    <strong>Nutrient Balance:</strong>
                    <ul style="margin:8px 0 0 20px; text-align:left;">
                        ${Object.entries(analysis.nutrient_balance).map(([k, v]) => `<li>${k}: ${(v*100).toFixed(1)}%</li>`).join('')}
                    </ul>
                </div>
            `;

            this.totalOutput.innerHTML = html;
        } catch (err) {
            console.error('Calculate error:', err);
            this.totalOutput.textContent = "Error calculating total";
            showToast("Failed to calculate total");
        } finally {
            if (spinner && spinner.parentNode === btn) {
                btn.removeChild(spinner);
            }
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }

    async resetIngredients() {
    const list = this.ingredientList;
    if (!list) return;

    list.classList.add('reset-animation');

    try {
        const response = await fetchWithSession(`${API_BASE}/reset`, { 
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error('Reset failed');
        }

        await this.fetchIngredients();
        this.updateRecipeSource('');
        showToast("All ingredients cleared");
        localStorage.setItem('currentRecipe', '');
        
        // Reset UI elements
        const recipeSearchInput = document.getElementById("recipeSearchInput");
        if (recipeSearchInput) recipeSearchInput.value = "";
        
        const suggestionsSection = document.getElementById("recipeSuggestionsSection");
        if (suggestionsSection) suggestionsSection.style.display = "none";
        
        if (this.totalOutput) {
            this.totalOutput.innerHTML = "Click \"Calculate\" to see total nutrition.";
        }

        // Hide AI section if visible
        const aiSection = document.getElementById('aiAnalysisSection');
        if (aiSection && aiSection.style.display === 'block') {
            aiSection.classList.add('hiding');
            setTimeout(() => {
                aiSection.style.display = 'none';
                aiSection.classList.remove('hiding');
            }, 300);
        }

    } catch (error) {
        console.error('Reset error:', error);
        showToast('Failed to clear list');
    } finally {
        list.classList.remove('reset-animation');
    }
}

    showError(input, message) {
        input.classList.add('input-error');
        showToast(message);
    }

    clearError(input) {
        input.classList.remove('input-error');
    }

    clearErrors() {
        this.clearError(this.nameInput);
        this.clearError(this.gramsInput);
    }

    clearInputs() {
        this.nameInput.value = "";
        this.gramsInput.value = "";
        this.clearErrors();
    }

    handleError(error) {
        this.showError(this.nameInput, error.message || 'Failed to add ingredient!');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const manager = new IngredientManager();
    manager.fetchIngredients();
});

