class AIManager {
    constructor() {
        this.initializeEventListeners();
        this.aiSection = document.getElementById('aiAnalysisSection');
        this.aiSuggestionsContainer = document.getElementById('aiSmartSuggestions');
    }

    initializeEventListeners() {
        // AI Suggestions button
        document.getElementById('getSmartSuggestionsBtn')?.addEventListener('click', () => this.showSmartSuggestions());
        
        // AI Analysis buttons
        document.getElementById('analyzeNutritionBtn')?.addEventListener('click', () => this.analyzeNutrition());
        document.getElementById('getRecommendationsBtn')?.addEventListener('click', () => this.getSmartRecommendations());
    }

    async showSmartSuggestions() {
        if (!this.aiSection || !this.aiSuggestionsContainer) return;
        
        this.aiSection.style.display = 'block';
        this.aiSuggestionsContainer.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div>Loading suggestions...</div>';

        // Show hide button
        const hideBtn = document.querySelector('.ai-hide-btn');
        if (hideBtn) hideBtn.style.display = 'flex';

        try {
            const ingredients = await fetchWithSession(`${API_BASE}/ingredients`).then(r => r.json());
            const names = ingredients.map(i => i.name);
            const res = await fetchWithSession(`${API_BASE}/smartrecommendations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ingredients: names })
            });
            const recommendations = await res.json();

            this.displayRecommendations(recommendations);
        } catch (err) {
            console.error('Smart suggestions error:', err);
            this.aiSuggestionsContainer.innerHTML = '<div>Error loading smart suggestions.</div>';
        }
    }

    displayRecommendations(recommendations) {
        if (!recommendations.length) {
            this.aiSuggestionsContainer.innerHTML = '<div>No smart suggestions found.</div>';
            return;
        }

        this.aiSuggestionsContainer.innerHTML = `
            <div class="recipe-grid">
                ${recommendations.map(recipe => this.createRecipeCard(recipe)).join('')}
            </div>
        `;

        // Add click handlers for recipe titles
        this.attachRecipeClickHandlers();
    }

    createRecipeCard(recipe) {
        const similarity = recipe.similarity !== undefined && !isNaN(recipe.similarity)
            ? Math.round(recipe.similarity * 100)
            : null;

        return `
            <div class="recipe-card visible">
                <h4 class="recipe-title" role="button" data-recipe="${recipe.name.replace(/'/g, "\\'")}">
                    ${recipe.name}
                </h4>
                ${recipe.description ? `<p class="recipe-description">${recipe.description}</p>` : ''}
                ${similarity ? `<div class="match-score">${similarity}% match</div>` : ''}
            </div>
        `;
    }

    attachRecipeClickHandlers() {
        this.aiSuggestionsContainer.querySelectorAll('.recipe-title').forEach(title => {
            title.addEventListener('click', (e) => this.handleRecipeClick(e));
        });
    }

    async handleRecipeClick(e) {
        const recipeName = e.target.dataset.recipe;
        const title = e.target;
        title.classList.add('loading');

        try {
            await this.loadRecipe(recipeName);
        } finally {
            title.classList.remove('loading');
        }
    }

    async loadRecipe(recipeName) {
        try {
            await fetchWithSession(`${API_BASE}/reset`, { method: "DELETE" });
            const response = await fetchWithSession(`${API_BASE}/getrecipe?name=${encodeURIComponent(recipeName)}`);
            if (!response.ok) throw new Error('Failed to get recipe');
            
            const recipeDetails = await response.json();
            const {addedCount, skippedIngredients} = await this.addRecipeIngredients(recipeDetails);

            if (addedCount > 0) {
                localStorage.setItem('currentRecipe', `🤖 ${recipeName}`);
                if (skippedIngredients.length > 0) {
                    showToast(`Added ${addedCount} ingredients. Skipped: ${skippedIngredients.slice(0,2).join(', ')}${skippedIngredients.length > 2 ? '...' : ''}`);
                }
                window.location.href = 'index.html';
            } else {
                showToast('No ingredients could be added');
            }
        } catch (error) {
            console.error('Recipe loading error:', error);
            showToast("Error loading recipe!");
        }
    }

    async addRecipeIngredients(recipeDetails) {
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
                console.error('Error adding ingredient:', err);
                skippedIngredients.push(ingredient.name);
            }
        }

        return { addedCount, skippedIngredients };
    }

    async analyzeNutrition() {
        const btn = document.getElementById('analyzeNutritionBtn');
        if (!btn) return;

        btn.disabled = true;
        
        try {
            const analysis = await this.fetchNutritionAnalysis();
            this.displayNutritionAnalysis(analysis);
            showToast("AI Analysis Complete! 🤖");
        } catch (error) {
            console.error('Analysis error:', error);
            showToast("AI Analysis Failed");
        } finally {
            btn.disabled = false;
        }
    }

    async fetchNutritionAnalysis() {
        const ingredients = this.gatherIngredients();
        const res = await fetchWithSession(`${API_BASE}/analyzenutrition`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ingredients)
        });
        return await res.json();
    }

    gatherIngredients() {
        return Array.from(document.querySelectorAll('#ingredientTable tbody tr')).map(row => {
            const cells = row.querySelectorAll('td');
            return {
                name: cells[0].textContent,
                grams: parseFloat(cells[1].textContent),
                calories: parseFloat(cells[2].textContent),
                proteins: parseFloat(cells[3].textContent),
                carbs: parseFloat(cells[4].textContent),
                fats: parseFloat(cells[5].textContent),
                fiber: parseFloat(cells[6].textContent)
            };
        });
    }

    displayNutritionAnalysis(analysis) {
        const scoreColor = this.getHealthScoreColor(analysis.health_score);
        
        document.getElementById('healthScore').innerHTML = this.renderHealthScore(analysis.health_score, scoreColor);
        document.getElementById('recommendations').innerHTML = this.renderRecommendations(analysis.recommendations);
        document.getElementById('nutrientBalance').innerHTML = this.renderNutrientBalance(analysis);
    }

    getHealthScoreColor(score) {
        return score >= 80 ? '#2ecc71' : 
               score >= 60 ? '#f1c40f' : '#e74c3c';
    }

    renderHealthScore(score, color) {
        return `
            <h3>AI Health Score</h3>
            <div class="score-circle" style="background: ${color}">
                ${Math.round(score)}
            </div>
        `;
    }

    renderRecommendations(recommendations) {
        return `
            <h3>AI-Powered Recommendations</h3>
            <ul class="smart-recommendations">
                ${recommendations.map(rec => `
                    <li><span class="ai-icon">🤖</span>${rec}</li>
                `).join('')}
            </ul>
        `;
    }

    renderNutrientBalance(analysis) {
        return `
            <h3>Advanced Nutrient Analysis</h3>
            <div class="nutrient-bars">
                ${Object.entries(analysis.nutrient_balance).map(([nutrient, value]) => `
                    <div class="nutrient-bar">
                        <label>
                            ${nutrient}
                            <span class="score ${this.getNutrientScoreClass(analysis.nutrient_scores[nutrient])}">
                                ${Math.round(analysis.nutrient_scores[nutrient] * 100)}%
                            </span>
                        </label>
                        <div class="bar">
                            <div class="fill" style="width: ${value * 100}%" 
                                 title="${Math.round(value * 100)}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getNutrientScoreClass(score) {
        return score >= 0.8 ? 'excellent' : 
               score >= 0.6 ? 'good' : 'needs-improvement';
    }
}

// Initialize AI functionality
document.addEventListener('DOMContentLoaded', () => {
    const aiManager = new AIManager();
});

// Export hide function for global access
window.hideAiSuggestions = () => {
    const aiSection = document.getElementById('aiAnalysisSection');
    if (!aiSection) return;

    aiSection.classList.add('hiding');
    setTimeout(() => {
        aiSection.style.display = 'none';
        aiSection.classList.remove('hiding');
    }, 800);
};