// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

package database

import (
	"html"
	"regexp"
	"strings"
)

func ValidateIngredientName(name string) bool {
	matched, _ := regexp.MatchString(`^[a-zA-Z0-9\s\-\.,()]+$`, name)
	return matched && len(name) <= 100
}

func ValidateGrams(grams float64) bool {
	return grams > 0 && grams <= 10000
}

func SanitizeDescription(description string) string {
	return html.EscapeString(strings.TrimSpace(description))
}
