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
