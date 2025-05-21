# Copyright (c) 2025 @drclcomputers. All rights reserved.
#
# This work is licensed under the terms of the MIT license.
# For a copy, see <https://opensource.org/licenses/MIT>.

import sys
import json
import argparse
from typing import List, Dict, Optional
import numpy as np
from sklearn.preprocessing import MinMaxScaler

def analyze_nutrition(ingredients: List[Dict], user_profile: Optional[Dict] = None) -> Dict:
    total_calories = sum(ing.get('calories', 0) for ing in ingredients)
    total_proteins = sum(ing.get('proteins', 0) for ing in ingredients)
    total_carbs = sum(ing.get('carbs', 0) for ing in ingredients)
    total_fats = sum(ing.get('fats', 0) for ing in ingredients)
    total_fiber = sum(ing.get('fiber', 0) for ing in ingredients)
    
    metrics = {
        'protein_ratio': min(total_proteins * 4 / total_calories if total_calories > 0 else 0, 1) * 30,
        'fiber_score': min(total_fiber / 30, 1) * 20,
        'fat_balance': (1 - abs(0.3 - (total_fats * 9 / total_calories if total_calories > 0 else 0))) * 25,
        'carb_balance': (1 - abs(0.5 - (total_carbs * 4 / total_calories if total_calories > 0 else 0))) * 25
    }
    
    health_score = sum(metrics.values())
    
    tdee = 0
    goal_calories = 0
    
    if user_profile:
        if user_profile.get('gender') == 'male':
            bmr = 10 * user_profile.get('weight', 70) + 6.25 * user_profile.get('height', 170) - 5 * user_profile.get('age', 30) + 5
        elif user_profile.get('gender') == 'female':
            bmr = 10 * user_profile.get('weight', 60) + 6.25 * user_profile.get('height', 160) - 5 * user_profile.get('age', 30) - 161
        else:
            bmr = 10 * user_profile.get('weight', 65) + 6.25 * user_profile.get('height', 165) - 5 * user_profile.get('age', 30) - 78
        
        activity_level = user_profile.get('activityLevel', 'sedentary')
        activity_factors = {
            'sedentary': 1.2,
            'light': 1.375,
            'moderate': 1.55,
            'active': 1.725,
            'very_active': 1.9
        }
        tdee = bmr * activity_factors.get(activity_level, 1.2)
        
        goal = user_profile.get('goal', 'maintain')
        if goal == 'lose':
            goal_calories = tdee - 500
        elif goal == 'gain':
            goal_calories = tdee + 500
        else:
            goal_calories = tdee
    
    recommendations = []
    
    if total_proteins < 20:
        recommendations.append("Add lean protein sources like chicken, fish, or legumes")
    elif total_proteins > 100:
        recommendations.append("Consider reducing protein intake to maintain balance")
        
    carb_ratio = total_carbs * 4 / total_calories if total_calories > 0 else 0
    if carb_ratio < 0.4:
        recommendations.append("Include more complex carbohydrates for sustained energy")
    elif carb_ratio > 0.7:
        recommendations.append("Reduce carbohydrate ratio for better macronutrient balance")
        
    fat_ratio = total_fats * 9 / total_calories if total_calories > 0 else 0
    if fat_ratio < 0.2:
        recommendations.append("Include healthy fats from nuts, avocados, or olive oil")
    elif fat_ratio > 0.35:
        recommendations.append("Consider reducing fat intake for heart health")
        
    if total_fiber < 25:
        recommendations.append("Increase fiber intake with whole grains and vegetables")
    
    if user_profile:
        if goal_calories > 0:
            percentage_of_goal = (total_calories / goal_calories) * 100 if goal_calories > 0 else 0
            
            if percentage_of_goal < 85:
                recommendations.append(f"This meal provides only {percentage_of_goal:.1f}% of your daily calorie goal ({goal_calories:.0f} kcal)")
            elif percentage_of_goal > 120:
                recommendations.append(f"This meal exceeds {percentage_of_goal:.1f}% of your daily calorie goal ({goal_calories:.0f} kcal)")
        
        age = user_profile.get('age', 30)
        if age > 50 and total_fiber < 30:
            recommendations.append("Adults over 50 need more fiber for digestive health")
        
        goal = user_profile.get('goal', 'maintain')
        if goal == 'lose' and total_calories > (goal_calories * 0.4):
            recommendations.append(f"For weight loss, consider smaller portions (aim for meals under {(goal_calories * 0.4):.0f} calories)")
        
        dietary_restrictions = user_profile.get('dietary_restrictions', [])
        ingredient_names = [ing.get('name', '').lower() for ing in ingredients]
        
        if 'vegan' in dietary_restrictions:
            non_vegan = any(item in ingredient_names for item in ['meat', 'chicken', 'beef', 'pork', 'fish', 'egg', 'milk', 'cheese', 'yogurt'])
            if non_vegan:
                recommendations.append("This recipe contains non-vegan ingredients")
                
        if 'vegetarian' in dietary_restrictions:
            non_vegetarian = any(item in ingredient_names for item in ['meat', 'chicken', 'beef', 'pork', 'fish'])
            if non_vegetarian:
                recommendations.append("This recipe contains non-vegetarian ingredients")
                
        if 'gluten_free' in dietary_restrictions:
            has_gluten = any(item in ingredient_names for item in ['wheat', 'barley', 'rye', 'bread', 'pasta', 'flour'])
            if has_gluten:
                recommendations.append("This recipe may contain gluten")
                
        if 'dairy_free' in dietary_restrictions:
            has_dairy = any(item in ingredient_names for item in ['milk', 'cheese', 'yogurt', 'butter', 'cream'])
            if has_dairy:
                recommendations.append("This recipe contains dairy products")
   
    optimal_ranges = {
        "Proteins": [0.25, 0.35],
        "Carbs": [0.45, 0.65],
        "Fats": [0.20, 0.35]
    }
    
    total = total_proteins + total_carbs + total_fats
    if total > 0:
        nutrient_balance = {
            "Proteins": total_proteins / total,
            "Carbs": total_carbs / total,
            "Fats": total_fats / total
        }
    else:
        nutrient_balance = {"Proteins": 0, "Carbs": 0, "Fats": 0}
    
    nutrient_scores = {}
    for nutrient, value in nutrient_balance.items():
        optimal_min, optimal_max = optimal_ranges[nutrient]
        if value < optimal_min:
            score = value / optimal_min
        elif value > optimal_max:
            score = 1 - ((value - optimal_max) / (1 - optimal_max))
        else:
            score = 1.0
        nutrient_scores[nutrient] = round(score, 2)

    user_data = {}
    if user_profile:
        user_data = {
            "daily_calorie_goal": round(goal_calories),
            "meal_percentage": round((total_calories / goal_calories * 100) if goal_calories > 0 else 0, 1),
            "tdee": round(tdee),
            "has_dietary_conflicts": any(rec for rec in recommendations if "contains" in rec)
        }
    
    return {
        "health_score": round(health_score, 1),
        "recommendations": recommendations,
        "nutrient_balance": nutrient_balance,
        "nutrient_scores": nutrient_scores,
        "metrics_breakdown": metrics,
        "user_data": user_data
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data', type=str, required=False)
    parser.add_argument('--file', type=str, required=False)
    parser.add_argument('--user-profile', type=str, required=False)
    args = parser.parse_args()

    if args.file:
        with open(args.file, 'r', encoding='utf-8') as f:
            ingredients = json.load(f)
    elif args.data:
        ingredients = json.loads(args.data)
    else:
        print("No input data provided", file=sys.stderr)
        sys.exit(1)
    
    user_profile = None
    if args.user_profile:
        user_profile = json.loads(args.user_profile)

    result = analyze_nutrition(ingredients, user_profile)
    print(json.dumps(result))

if __name__ == '__main__':
    main()