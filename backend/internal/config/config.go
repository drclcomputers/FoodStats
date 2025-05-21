// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

package config

import (
	"os"
	"sync"
)

var UserIngredients = make(map[string][]Ingredient)
var MU sync.Mutex

func IsDev() bool {
	return os.Getenv("GO_ENV") != "production"
}

func GetPort() string {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	return port
}
