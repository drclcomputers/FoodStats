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
	var pythonPath string
	var err error

	if runtime.GOOS == "windows" {
		pythonPath, err = exec.LookPath("python")
		if err == nil {
			return pythonPath
		}
	} else {
		pythonPath, err = exec.LookPath("python3")
		if err == nil {
			return pythonPath
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
			"/app/internal/mls",
			".",
			".",
			"./backend/internal/mls",
			"../internal/mls",
			"/home/runner/FoodStats/internal/mls",
			"/home/runner/FoodStats/backend/internal/mls",
		}

		for _, path := range candidates {
			if _, err := os.Stat(path); err == nil {
				if _, err := os.Stat(filepath.Join(path, "analyzer.py")); err == nil {
					mlsPath = path
					break
				}
			}
		}

		if mlsPath == "" {
			mlsPath = "/app/internal/mls"
		}
	} else {
		mlsPath = filepath.Join("internal", "mls")
	}

	return &AIService{
		pythonPath: detectPythonExecutable(),
		mlsPath:    mlsPath,
	}
}

func (s *AIService) GetRecipeRecommendations(ingredients []string) ([]config.Recipe, error) {
	recommendPath := filepath.Join(s.mlsPath, "./backend/internal/mls/recommend.py")

	if _, err := os.Stat(recommendPath); os.IsNotExist(err) {
		possiblePaths := []string{
			"./backend/internal/mls/recommend.py",
			"recommend.py",
			"./internal/mls/recommend.py",
			"../internal/mls/recommend.py",
			"/opt/render/project/src/internal/mls/recommend.py",
		}

		for _, path := range possiblePaths {
			if _, err := os.Stat(path); err == nil {
				recommendPath = path
				break
			}
		}
	}

	if s.pythonPath == "" {
		s.pythonPath = detectPythonExecutable()
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
	data, err := json.Marshal(ingredients)
	if err != nil {
		return nil, err
	}

	scriptPath := filepath.Join(s.mlsPath, "./backend/internal/mls/analyzer.py")

	if _, err := os.Stat(scriptPath); os.IsNotExist(err) {
		possiblePaths := []string{
			"./backend/internal/mls/analyzer.py",
			"analyzer.py",
			"./internal/mls/analyzer.py",
			"../internal/mls/analyzer.py",
			"/opt/render/project/src/internal/mls/analyzer.py",
		}

		for _, path := range possiblePaths {
			if _, err := os.Stat(path); err == nil {
				scriptPath = path
				break
			}
		}
	}

	if s.pythonPath == "" {
		s.pythonPath = detectPythonExecutable()
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
