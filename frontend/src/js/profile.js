// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

class ProfileManager {
    constructor() {
        this.profileForm = document.getElementById('profileForm');
        this.nutritionData = document.getElementById('nutritionData');
        this.resetProfileBtn = document.getElementById('resetProfileBtn');

        this.initEventListeners();
        this.loadProfile();
        
        console.log("ProfileManager initialized");
    }
    
    initEventListeners() {
        this.profileForm.addEventListener('submit', (e) => this.handleSubmit(e));
        this.resetProfileBtn.addEventListener('click', () => this.resetProfile());
    }

    async resetProfile() {
        if (!confirm("Are you sure you want to reset your profile? This will delete all your personal data.")) {
            return;
        }
        
        try {
            localStorage.removeItem('userProfile');
            
            try {
                await fetchWithSession(`${API_BASE}/resetprofile`, {
                    method: 'DELETE'
                });
                console.log('Profile reset on server');
            } catch (serverError) {
                console.error('Failed to reset profile on server:', serverError);
            }
            this.profileForm.reset();
            this.nutritionData.innerHTML = '<p>Complete your profile to see personalized nutritional requirements</p>';
            
            showToast('Profile reseted successfully!');
        } catch (error) {
            console.error('Error resetting profile:', error);
            showToast('Error resetting profile');
        }
    }
    
    async handleSubmit(e) {
        e.preventDefault();

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
        
        const formData = new FormData(this.profileForm);
        const profileData = {
            age: parseInt(formData.get('age')),
            gender: formData.get('gender'),
            weight: parseFloat(formData.get('weight')),
            height: parseFloat(formData.get('height')),
            activityLevel: formData.get('activityLevel'),
            goal: formData.get('goal'),
            dietary_restrictions: formData.getAll('dietary_restrictions')
        };
        
        try {
            localStorage.setItem('userProfile', JSON.stringify(profileData));
            console.log('Profile saved to localStorage:', profileData);

            const response = await fetchWithSession(`${API_BASE}/saveprofile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to save profile');
            }
            
            showToast('Profile saved successfully!');
            this.updateNutritionRequirements(profileData);
        } catch (error) {
            console.error('Error saving profile:', error);
            showToast('Failed to save profile. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
    
    loadProfile() {
        const savedProfile = localStorage.getItem('userProfile');
        
        if (savedProfile) {
            try {
                const profileData = JSON.parse(savedProfile);
                this.fillFormWithData(profileData);
                this.updateNutritionRequirements(profileData);
                console.log("Loaded profile from localStorage:", profileData);
            } catch (error) {
                console.error("Failed to parse saved profile:", error);
            }
        } else {
            this.loadProfileFromServer();
        }
    }

    async loadProfileFromServer() {
        try {
            const response = await fetchWithSession(`${API_BASE}/getprofile`);
            if (!response.ok) return;
            
            const profileData = await response.json();
            if (profileData && profileData.age) {
                localStorage.setItem('userProfile', JSON.stringify(profileData));
                this.fillFormWithData(profileData);
                this.updateNutritionRequirements(profileData);
                console.log("Loaded profile from server:", profileData);
            }
        } catch (error) {
            console.error("Failed to load profile from server:", error);
        }
    }
    
    fillFormWithData(data) {
        document.getElementById('age').value = data.age || '';
        document.getElementById('gender').value = data.gender || '';
        document.getElementById('weight').value = data.weight || '';
        document.getElementById('height').value = data.height || '';
        document.getElementById('activityLevel').value = data.activityLevel || '';
        document.getElementById('goal').value = data.goal || '';
        
        document.querySelectorAll('input[name="dietary_restrictions"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        if (data.dietary_restrictions && Array.isArray(data.dietary_restrictions)) {
            data.dietary_restrictions.forEach(restriction => {
                const checkbox = document.querySelector(`input[value="${restriction}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }
    }
    
    updateNutritionRequirements(profileData) {
        let bmr = 0;
        
        if (profileData.gender === 'male') {
            bmr = 10 * profileData.weight + 6.25 * profileData.height - 5 * profileData.age + 5;
        } else if (profileData.gender === 'female') {
            bmr = 10 * profileData.weight + 6.25 * profileData.height - 5 * profileData.age - 161;
        } else {
            const maleBmr = 10 * profileData.weight + 6.25 * profileData.height - 5 * profileData.age + 5;
            const femaleBmr = 10 * profileData.weight + 6.25 * profileData.height - 5 * profileData.age - 161;
            bmr = (maleBmr + femaleBmr) / 2;
        }
        
        let tdee = 0;
        switch (profileData.activityLevel) {
            case 'sedentary':
                tdee = bmr * 1.2;
                break;
            case 'light':
                tdee = bmr * 1.375;
                break;
            case 'moderate':
                tdee = bmr * 1.55;
                break;
            case 'active':
                tdee = bmr * 1.725;
                break;
            case 'very_active':
                tdee = bmr * 1.9;
                break;
            default:
                tdee = bmr * 1.2;
        }
        
        let goalCalories = tdee;
        let goalDescription = '';
        
        switch (profileData.goal) {
            case 'lose':
                goalCalories = tdee - 500;
                goalDescription = 'Calorie deficit for weight loss';
                break;
            case 'gain':
                goalCalories = tdee + 500;
                goalDescription = 'Calorie surplus for weight gain';
                break;
            default:
                goalDescription = 'Maintenance calories';
        }
        
        const protein = profileData.weight * 2.2;
        const fat = (goalCalories * 0.25) / 9;
        const carbs = (goalCalories - (protein * 4) - (fat * 9)) / 4;
        
        this.nutritionData.innerHTML = `
            <div class="nutrition-card">
                <h3>Daily Calories</h3>
                <p class="nutrition-value">${Math.round(goalCalories)} kcal</p>
                <p class="nutrition-note">${goalDescription}</p>
            </div>
            <div class="nutrition-card">
                <h3>Macronutrients</h3>
                <p><strong>Protein:</strong> ${Math.round(protein)}g (${Math.round(protein * 4)} kcal)</p>
                <p><strong>Carbs:</strong> ${Math.round(carbs)}g (${Math.round(carbs * 4)} kcal)</p>
                <p><strong>Fat:</strong> ${Math.round(fat)}g (${Math.round(fat * 9)} kcal)</p>
            </div>
            <div class="nutrition-card">
                <h3>Recommended Water</h3>
                <p class="nutrition-value">${Math.round(profileData.weight * 0.033)} L</p>
                <p class="nutrition-note">Based on your body weight</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SuggestionsManager();
    new ProfileManager();
});