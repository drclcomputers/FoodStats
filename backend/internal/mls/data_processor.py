import json
import os
import sqlite3
import sys
import re
from collections import defaultdict

def normalize_ingredient(name):
    """Normalize ingredient names for smarter matching."""
    name = name.strip().lower()
    # Remove plural 's', punctuation, etc.
    name = re.sub(r'[^\w\s]', '', name)
    if name.endswith('es'):
        name = name[:-2]
    elif name.endswith('s'):
        name = name[:-1]
    # Synonyms (expand as needed)
    synonyms = {
        "chickpeas": "garbanzo beans",
        "garbanzo bean": "chickpea",
        "bell pepper": "capsicum",
        "capsicums": "bell pepper",
        "tomatoes": "tomato",
        "potatoes": "potato",
        "onions": "onion",
        "eggs": "egg",
        "greens": "lettuce",
        "spinaches": "spinach",
        "carrots": "carrot",
        "beans": "bean",
        "apples": "apple",
        "bananas": "banana",
        "berries": "berry",
        "strawberries": "strawberry",
        "blueberries": "blueberry",
        "raspberries": "raspberry",
        "yogurts": "yogurt",
        "milks": "milk",
        "cheeses": "cheese",
        "breads": "bread",
        "pastas": "pasta",
        "rices": "rice",
        "meats": "meat",
        "fishes": "fish",
        "chickens": "chicken",
        "turkeys": "turkey",
        "beefs": "beef",
        "porks": "pork",
        "sausages": "sausage",
        "hams": "ham",
        "bacons": "bacon",
        "tofus": "tofu",
        "tempehs": "tempeh",
        "lentils": "lentil",
        "peas": "pea",
        "nuts": "nut",
        "seeds": "seed",
        "oils": "oil",
        "butters": "butter",
        "creams": "cream",
        "sugars": "sugar",
        "honeys": "honey",
        "jams": "jam",
        "marmalades": "marmalade",
        "juices": "juice",
        "teas": "tea",
        "coffees": "coffee",
        "waters": "water",
        "sodas": "soda",
        "beers": "beer",
        "wines": "wine",
        "vodkas": "vodka",
        "whiskeys": "whiskey",
        "gins": "gin",
        "rums": "rum",
        "liqueurs": "liqueur",
        "spices": "spice",
        "herbs": "herb",
        "seasonings": "seasoning",
        "condiments": "condiment",
        "sauces": "sauce",
        "dressings": "dressing",
        "mayonnaises": "mayonnaise",
        "mustards": "mustard",
        "ketchups": "ketchup",
        "vinegars": "vinegar",
        "pickles": "pickle",
        "olives": "olive",
        "mushrooms": "mushroom",
        "peppers": "pepper",
        "chilies": "chili",
        "jalapenos": "jalapeno",
        "avocados": "avocado",
        "lemons": "lemon",
        "limes": "lime",
        "oranges": "orange",
        "grapefruits": "grapefruit",
        "grapes": "grape",
        "melons": "melon",
        "watermelons": "watermelon",
        "cantaloupes": "cantaloupe",
        "honeydews": "honeydew",
        "pineapples": "pineapple",
        "mangoes": "mango",
        "peaches": "peach",
        "plums": "plum",
        "apricots": "apricot",
        "cherries": "cherry",
        "figs": "fig",
        "dates": "date",
        "prunes": "prune",
        "raisins": "raisin",
        "currants": "currant",
        "gooseberries": "gooseberry",
        "kiwis": "kiwi",
        "persimmons": "persimmon",
        "pomegranates": "pomegranate",
        "starfruits": "starfruit",
        "passionfruits": "passionfruit",
        "dragonfruits": "dragonfruit",
        "lychees": "lychee",
        "guavas": "guava",
        "papayas": "papaya",
        "coconuts": "coconut",
        "tangerines": "tangerine",
        "mandarins": "mandarin",
        "kumquats": "kumquat",
        "mulberries": "mulberry",
        "loganberries": "loganberry",
        "boysenberries": "boysenberry",
        "cranberries": "cranberry",
        "elderberries": "elderberry",
        "cloudberries": "cloudberry",
        "rowanberries": "rowanberry",
        "salmonberries": "salmonberry",
        "huckleberries": "huckleberry",
        "serviceberries": "serviceberry",
        "saskatoons": "saskatoon",
        "chokecherries": "chokecherry",
        "aronias": "aronia",
        "medlars": "medlar",
        "quince": "quince",
        "loquats": "loquat",
        "rambutans": "rambutan",
        "longans": "longan",
        "sapotes": "sapote",
        "soursops": "soursop",
        "cherimoyas": "cherimoya",
        "custard apples": "custard apple",
        "santols": "santol",
        "tamarinds": "tamarind",
        "ackees": "ackee",
        "breadfruits": "breadfruit",
        "durian": "durian",
        "langsat": "langsat",
        "mangosteen": "mangosteen"
    }
    if name in synonyms:
        name = synonyms[name]
    return name

def deduplicate_ingredients(ingredients):
    """Deduplicate and normalize a list of ingredients."""
    seen = set()
    result = []
    for ing in ingredients:
        norm = normalize_ingredient(ing)
        if norm not in seen:
            seen.add(norm)
            result.append(norm)
    return result

def load_recipes():
    """
    Loads recipes from a JSON file, SQLite database, or fallback to hardcoded.
    Cleans and deduplicates ingredients for AI matching.
    """
    dir_path = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(dir_path, "recipes.json")
    db_path = os.path.join(dir_path, "..", "..", "database", "nutrition_data.db")

    # 1. Try JSON file
    if os.path.exists(json_path):
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                recipes = json.load(f)
                for r in recipes:
                    r["ingredients"] = deduplicate_ingredients(r.get("ingredients", []))
                return recipes
        except Exception as e:
            print(f"Error loading recipes.json: {e}", file=sys.stderr)

    # 2. Try SQLite database
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT id, name, description FROM recipes")
            recipes = []
            for recipe_id, name, description in cursor.fetchall():
                cursor.execute(
                    "SELECT ingredient_name, grams FROM recipe_ingredients WHERE recipe_id = ?",
                    (recipe_id,)
                )
                ingredients = [row[0] for row in cursor.fetchall()]
                ingredients = deduplicate_ingredients(ingredients)
                recipes.append({
                    "name": name,
                    "ingredients": ingredients,
                    "description": description or ""
                })
            conn.close()
            if recipes:
                return recipes
        except Exception as e:
            print(f"Error loading recipes from DB: {e}", file=sys.stderr)

    # 3. (Optional) Try fetching from an API (future expansion)
    # You can add code here to fetch recipes from a remote API if desired.

    # 4. Fallback: hardcoded recipes
    return [
        {
            "name": "Chicken Salad",
            "ingredients": deduplicate_ingredients(["Chicken", "Lettuce", "Tomato"]),
            "description": "A healthy chicken salad."
        },
        {
            "name": "Tomato Soup",
            "ingredients": deduplicate_ingredients(["Tomato", "Onion"]),
            "description": "Classic tomato soup."
        }
    ]