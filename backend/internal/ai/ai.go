package ai

import (
	"FoodStats/internal/config"
	"encoding/json"
	"fmt"
	"log"
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
	return &AIService{
		pythonPath: detectPythonExecutable(),
		mlsPath:    filepath.Join("internal", "mls"),
	}
}

func (s *AIService) GetRecipeRecommendations(ingredients []string) ([]config.Recipe, error) {
	cmd := exec.Command(s.pythonPath,
		filepath.Join(s.mlsPath, "__init__.py"),
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

func (s *AIService) AnalyzeNutrition(ingredients []config.Ingredient) (*config.NutritionAnalysis, error) {
	data, err := json.Marshal(ingredients)
	if err != nil {
		return nil, err
	}

	scriptPath := filepath.Join(s.mlsPath, "analyzer.py")
	log.Printf("Running Python script at: %s", scriptPath)

	cmd := exec.Command(s.pythonPath,
		scriptPath,
		"--data", string(data))

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

	print(output)

	return &analysis, nil
}
