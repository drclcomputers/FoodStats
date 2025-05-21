// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

package ai

import (
	"FoodStats/internal/config"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

type AIService struct {
	pythonPath string
	mlsPath    string
}

func detectPythonExecutable() string {
	if runtime.GOOS == "windows" {
		if path, err := exec.LookPath("python"); err == nil {
			return path
		}
	} else {
		if path, err := exec.LookPath("python3"); err == nil {
			return path
		}
		if path, err := exec.LookPath("python"); err == nil {
			return path
		}
	}
	return "python"
}

func NewAIService() *AIService {
	isRender := os.Getenv("RENDER") == "true"

	var mlsPath string
	if isRender {
		candidates := []string{
			filepath.Join("internal", "mls"),
			"/opt/render/project/src/internal/mls",
			"/opt/render/project/internal/mls",
			"/app/internal/mls",
			".",
		}

		cwd, _ := os.Getwd()
		log.Printf("Current working directory: %s", cwd)

		for _, path := range candidates {
			log.Printf("Checking MLS directory: %s", path)
			if _, err := os.Stat(path); err == nil {
				if _, err := os.Stat(filepath.Join(path, "analyzer.py")); err == nil {
					mlsPath = path
					log.Printf("Found valid MLS directory: %s", mlsPath)
					break
				}
			}
		}

		if mlsPath == "" {
			mlsPath = "/app/internal/mls"
			log.Printf("No valid MLS directory found, defaulting to: %s", mlsPath)
		}
	} else {
		mlsPath = filepath.Join("internal", "mls")
	}

	for _, env := range os.Environ() {
		if strings.HasPrefix(env, "RENDER") || strings.HasPrefix(env, "PATH") {
			log.Printf("Environment: %s", env)
		}
	}

	return &AIService{
		pythonPath: detectPythonExecutable(),
		mlsPath:    mlsPath,
	}
}

func (s *AIService) GetRecipeRecommendations(ingredients []string) ([]config.Recipe, error) {
	path, err := os.Getwd()
	if err != nil {
		log.Println(err)
	}
	fmt.Println(path)

	recommendPath := filepath.Join(s.mlsPath, "recommend.py")
	log.Printf("Looking for Python recommendation script at: %s", recommendPath)

	if _, err := os.Stat(recommendPath); os.IsNotExist(err) {
		log.Printf("ERROR: Python recommendation script not found at %s", recommendPath)
		possiblePaths := []string{
			"./backend/internal/mls/recommend.py",
			"recommend.py",
			"./internal/mls/recommend.py",
			"../internal/mls/recommend.py",
			"/opt/render/project/src/internal/mls/recommend.py",
		}

		for _, path := range possiblePaths {
			log.Printf("Checking alternative path: %s", path)
			if _, err := os.Stat(path); err == nil {
				recommendPath = path
				log.Printf("Found recommendation script at: %s", recommendPath)
				break
			}
		}
	}

	cmd := exec.Command(s.pythonPath,
		recommendPath,
		"--ingredients", strings.Join(ingredients, ","))

	output, err := cmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("AI recommendation error: %v\nOutput: %s", err, string(output))
	}

	var recipes []config.Recipe
	if err := json.Unmarshal(output, &recipes); err != nil {
		return nil, fmt.Errorf("failed to parse AI output: %v", err)
	}

	return recipes, nil
}

func (s *AIService) AnalyzeNutrition(ingredients []config.Ingredient, profile *config.UserProfile) (*config.NutritionAnalysis, error) {
	path, err := os.Getwd()
	if err != nil {
		log.Println(err)
	}
	fmt.Println(path)

	data, err := json.Marshal(ingredients)
	if err != nil {
		return nil, err
	}

	scriptPath := filepath.Join(s.mlsPath, "analyzer.py")
	log.Printf("Looking for Python script at: %s", scriptPath)

	if _, err := os.Stat(scriptPath); os.IsNotExist(err) {
		log.Printf("ERROR: Python script not found at %s", scriptPath)
		possiblePaths := []string{
			"./backend/internal/mls/analyzer.py",
			"analyzer.py",
			"./internal/mls/analyzer.py",
			"../internal/mls/analyzer.py",
			"/opt/render/project/src/internal/mls/analyzer.py",
		}

		for _, path := range possiblePaths {
			log.Printf("Checking alternative path: %s", path)
			if _, err := os.Stat(path); err == nil {
				scriptPath = path
				log.Printf("Found script at: %s", scriptPath)
				break
			}
		}
	}

	var cmd *exec.Cmd

	if profile != nil {
		profileData, err := json.Marshal(profile)
		if err != nil {
			return nil, err
		}

		cmd = exec.Command(s.pythonPath,
			scriptPath,
			"--data", string(data),
			"--user-profile", string(profileData))
	} else {
		cmd = exec.Command(s.pythonPath,
			scriptPath,
			"--data", string(data))
	}

	output, err := cmd.Output()
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			log.Printf("Python stderr: %s", string(exitErr.Stderr))
		}
		return nil, fmt.Errorf("nutrition analysis error: %v", err)
	}

	var analysis config.NutritionAnalysis
	if err := json.Unmarshal(output, &analysis); err != nil {
		return nil, fmt.Errorf("failed to parse analysis output: %v", err)
	}

	return &analysis, nil
}
