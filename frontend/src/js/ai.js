// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

const SELECTORS = {
    AI_SECTION: 'aiAnalysisSection',
    AI_SUGGESTIONS_CONTAINER: 'aiSmartSuggestions',
    GET_SMART_SUGGESTIONS_BTN: 'getSmartSuggestionsBtn',
    ANALYZE_NUTRITION_BTN: 'analyzeNutritionBtn',
    GET_RECOMMENDATIONS_BTN: 'getRecommendationsBtn',
    HIDE_AI_BTN_CLASS: '.ai-hide-btn',
    INGREDIENT_TABLE_BODY: '#ingredientTable tbody tr',
    HEALTH_SCORE_EL: 'healthScore',
    RECOMMENDATIONS_EL: 'recommendations',
    NUTRIENT_BALANCE_EL: 'nutrientBalance'
};

class AIManager {
    constructor() {
        this.aiSection = document.getElementById(SELECTORS.AI_SECTION);
        this.aiSuggestionsContainer = document.getElementById(SELECTORS.AI_SUGGESTIONS_CONTAINER);
        this.hideButton = this.aiSection?.querySelector(SELECTORS.HIDE_AI_BTN_CLASS);

        this.healthScoreEl = document.getElementById(SELECTORS.HEALTH_SCORE_EL);
        this.recommendationsEl = document.getElementById(SELECTORS.RECOMMENDATIONS_EL);
        this.nutrientBalanceEl = document.getElementById(SELECTORS.NUTRIENT_BALANCE_EL);

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById(SELECTORS.GET_SMART_SUGGESTIONS_BTN)?.addEventListener('click', () => this.showSmartSuggestions());
        document.getElementById(SELECTORS.ANALYZE_NUTRITION_BTN)?.addEventListener('click', () => this.analyzeNutrition());
        document.getElementById(SELECTORS.GET_RECOMMENDATIONS_BTN)?.addEventListener('click', () => this.getSmartRecommendations());
        this.hideButton?.addEventListener('click', () => this.hideSection());
    }

    async showSmartSuggestions() {
        if (!this.aiSection || !this.aiSuggestionsContainer) return;
        
        this.aiSection.style.display = 'block';
        this.aiSuggestionsContainer.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div>Loading suggestions...</div>';

        // Show hide button
        const hideBtn = document.querySelector(SELECTORS.HIDE_AI_BTN_CLASS);
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
        if (!recommendations || !recommendations.length) {
            this.aiSuggestionsContainer.innerHTML =
                "<div>No smart suggestions found at the moment.</div>";
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
        
        const sanitizedRecipeName = recipe.name.replace(/"/g, '&quot;').replace(/'/g, '\\\'');

        return `
            <div class="recipe-card visible">
                <h3 class="recipe-title">
                    ${recipe.name}
                </h3>
                ${
                recipe.description
                    ? `<p class="recipe-description">${recipe.description}</p>`
                    : ""
                }
                ${
                similarity !== null
                    ? `<div class="match-score">${similarity}% match</div>`
                    : ""
                }
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
        if (!recipeName) return;
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
                localStorage.setItem("currentRecipe", `🤖 ${recipeName}`);
                const toasts = JSON.parse(localStorage.getItem('toasts') || '[]');
                let toastMessage = `Added ${addedCount} ingredients from '${recipeName}'.`;
                
                if (skippedIngredients.length > 0) {
                    toastMessage += ` Skipped: ${skippedIngredients
                        .slice(0, 2)
                        .join(", ")}${skippedIngredients.length > 2 ? "..." : ""}.`;
                }
                toasts.push({ toastMessage, timestamp: Date.now() });
                localStorage.setItem('toasts', JSON.stringify(toasts));
                window.location.href = "index.html";
            } else {
                showToast(`No ingredients could be added from '${recipeName}'.`);
            }
        } catch (error) {
            console.error(`Recipe loading error for '${recipeName}':`, error);
            showToast(`Error loading recipe '${recipeName}'. Please try again.`);
        }
    }

    async addRecipeIngredients(recipeDetails) {
        let addedCount = 0;
        let skippedIngredients = [];

        if (!recipeDetails || !recipeDetails.ingredients) {
            console.error(
                "Invalid recipeDetails or missing ingredients array",
                recipeDetails
            );
            return { addedCount, skippedIngredients };
        }

        for (const ingredient of recipeDetails.ingredients) {
            if (!ingredient || !ingredient.name) {
                console.warn("Skipping invalid ingredient object:", ingredient);
                skippedIngredients.push("Unnamed ingredient");
                continue;
            }
            try {
                const ingResponse = await fetchWithSession(
                `${API_BASE}/addingredient`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                    name: ingredient.name,
                    grams: ingredient.grams,
                    }),
                }
                );

                if (ingResponse.ok) {
                    addedCount++;
                } else {
                    console.warn(`Failed to add ingredient '${ingredient.name}', status: ${ingResponse.status}`);
                    skippedIngredients.push(ingredient.name);
                }
            } catch (err) {
                console.error(`Error adding ingredient '${ingredient.name}':`, err);
                skippedIngredients.push(ingredient.name);
            }
        }
    }

    async analyzeNutrition() {
        const btn = document.getElementById(SELECTORS.ANALYZE_NUTRITION_BTN);
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
        return Array.from(document.querySelectorAll(SELECTORS.INGREDIENT_TABLE_BODY)).map(row => {
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
        if (!analysis || typeof analysis.health_score === "undefined") {
            console.error("Invalid analysis data received", analysis);
            showToast("Error displaying analysis results.");
            return;
        }
        
        const aiSection = document.getElementById(SELECTORS.AI_SECTION);
        if (aiSection) {
            aiSection.style.display = 'block';
        }
        
        const scoreColor = this.getHealthScoreColor(analysis.health_score);

        if (this.healthScoreEl) {
            this.healthScoreEl.innerHTML = this.renderHealthScore(
                analysis.health_score,
                scoreColor,
                analysis.user_data
            );
        }
        
        if (this.recommendationsEl && analysis.recommendations) {
            this.recommendationsEl.innerHTML = this.renderRecommendations(
                analysis.recommendations
            );
        }
        
        if (this.nutrientBalanceEl && analysis.nutrient_balance && analysis.nutrient_scores) {
            this.nutrientBalanceEl.innerHTML = this.renderNutrientBalance(analysis);
        }
    }

    renderHealthScore(score, color, userData) {
        let userDataHtml = '';
        
        if (userData && userData.daily_calorie_goal) {
            userDataHtml = `
                <div class="user-profile-info">
                    <p><strong>Your daily goal:</strong> ${userData.daily_calorie_goal} kcal</p>
                    <p><strong>This meal:</strong> ${userData.meal_percentage}% of your daily calories</p>
                    ${userData.has_dietary_conflicts ? 
                        '<p class="dietary-warning">⚠️ This recipe conflicts with your dietary preferences</p>' : ''}
                </div>
            `;
        }

        return `
            <h3>Health Score</h3>
            <div class="health-score-container">
                <div class="health-score" style="background-color: ${color}">
                    <span>${Math.round(score)}</span>
                </div>
                <div class="health-score-info">
                    <p class="score-label">Based on nutrition balance</p>
                    <p>${this.getScoreDescription(score)}</p>
                </div>
            </div>
            ${userDataHtml}
        `;
    }

    getHealthScoreColor(score) {
        if (score >= 80) return "#2ecc71";
        if (score >= 60) return "#f1c40f";
        return "#e74c3c";
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
                ${Object.entries(analysis.nutrient_balance)
                  .map(([nutrient, value]) => {
                    const nutrientScore = analysis.nutrient_scores[nutrient];
                    const scoreClass =
                      this.getNutrientScoreClass(nutrientScore);
                    const scorePercentage =
                      nutrientScore !== undefined
                        ? Math.round(nutrientScore * 100)
                        : "N/A";
                    return `
                    <div class="nutrient-bar">
                        <label>
                            ${
                              nutrient.charAt(0).toUpperCase() +
                              nutrient.slice(1)
                            }
                            <span class="score ${scoreClass}">
                                ${scorePercentage}%
                            </span>
                        </label>
                        <div class="bar">
                            <div class="fill" style="width: ${value * 100}%" 
                                 title="${Math.round(value * 100)}% RDA"></div>
                        </div>
                    </div>
                `;
                  })
                  .join("")}
            </div>
        `;
    }

    getNutrientScoreClass(score) {
        return score >= 0.8 ? 'excellent' : 
               score >= 0.6 ? 'good' : 'needs-improvement';
    }

    hideAISection() {
        const aiSection = document.getElementById(SELECTORS.AI_SECTION);
        if (!aiSection) return;

        aiSection.classList.add('hiding');
        
        const onAnimationEnd = () => {
            aiSection.style.display = 'none';
            aiSection.classList.remove('hiding');
        };

        aiSection.addEventListener('animationend', onAnimationEnd, { once: true });
        
        setTimeout(() => {
            if (aiSection.classList.contains('hiding')) {
                console.warn('AI section hide animation timed out. Hiding manually.');
                onAnimationEnd();
            }
        }, 850);
    }
}

// Initialize AI functionality
document.addEventListener('DOMContentLoaded', () => {
    new AIManager();
});

// Export hide function for global access
window.hideAiSuggestions = () => {
    const aiSection = document.getElementById(SELECTORS.AI_SECTION);
    if (!aiSection) return;

    aiSection.classList.add('hiding');
    setTimeout(() => {
        aiSection.style.display = 'none';
        aiSection.classList.remove('hiding');
    }, 800);
};