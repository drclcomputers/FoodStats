package database

import (
	"html"
	"regexp"
	"strings"
)

func validateIngredientName(name string) bool {
	matched, _ := regexp.MatchString(`^[a-zA-Z0-9\s\-\.,()]+$`, name)
	return matched && len(name) <= 100
}

func validateGrams(grams float64) bool {
	return grams > 0 && grams <= 10000
}

func sanitizeDescription(description string) string {
	return html.EscapeString(strings.TrimSpace(description))
}
