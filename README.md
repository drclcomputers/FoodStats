# 🥗 FoodStats

A modern desktop application for tracking nutritional information and discovering healthy recipes. Built with Electron and Go for a seamless, cross-platform desktop experience.

---

## 📋 Features

- **Real-time Nutrition Tracking**
  - Add ingredients with quantities
  - Smart auto-complete ingredient suggestions
  - Calculate total nutritional values
  - Track calories, proteins, carbs, fats, and fiber

- **Recipe Management**
  - Save and search for recipes
  - Suggest recipes based on your current ingredients
  - One-click ingredient list population from recipes

- **Healthy Living Recommendations**
  - 50+ healthy lifestyle tips and advice
  - Curated healthy recipes

- **Desktop Integration**
  - Native desktop application (Windows)
  - Automatic backend server management
  - System tray integration
  - Dark/Light mode with persistence

- **Responsive Design**
  - Mobile-friendly interface
  - Desktop-optimized layout
  - Cross-platform support

---

## 🚀 Tech Stack

### Frontend
- HTML5/CSS3
- Vanilla JavaScript
- Electron
- Custom dark mode implementation

### Backend
- Go (v1.24)
- SQLite3 database
- RESTful API architecture

---

## 🛠 Installation

### Development Setup

1. **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/FoodStats.git
    cd FoodStats
    ```

2. **Install dependencies**
    ```bash
    npm install
    ```

3. **Build the backend**
    ```bash
    cd backend
    go build -o FoodStats.exe
    cd ..
    ```

4. **Run in development mode**
    ```bash
    npm start
    ```

### Production Build

1. **Build the application**
    ```bash
    npm run dist
    ```

2. **Install the application**
  - Navigate to the `dist` folder
  - Run the installer (`.exe` for Windows)

---

## 🌐 API Endpoints

- `GET /api/ingredients` - List all ingredients
- `POST /api/add-ingredient` - Add a new ingredient
- `DELETE /api/delete-ingredient` - Remove an ingredient
- `GET /api/calculate` - Calculate total nutrition
- `GET /api/suggestions` - Get ingredient suggestions
- `DELETE /api/reset` - Reset ingredient list
- `GET /api/list-recipes` - List all recipes
- `GET /api/get-recipe?name=...` - Get a recipe by name
- `POST /api/save-recipe` - Save a new recipe
- `GET /api/suggest-recipes` - Suggest recipes based on current ingredients

---

## 📱 Screenshots

![FoodStats Main Interface](/README%20RESOURCES/img.png)
![FoodStats Dark Mode](/README%20RESOURCES/img_1.png)

---

## 💻 System Requirements

- Windows 10 or later
- 4GB RAM minimum
- 500MB disk space
- Internet connection for installation

---

## 🔧 Configuration

The application stores its settings in:
- Dark mode preference: LocalStorage
- Database: SQLite file in the application directory
- Server: Automatically managed by Electron

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

---

## 👤 Author

@drclcomputers

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🐛 Bug Reports

Please report any issues through:
1. GitHub Issues
2. Pull Requests
3. Email at [your-email]

---

## 🌟 Show your support

Give a ⭐️ if this project helped you!

---

## 📝 Changelog

### Version 2.0.0

- Major UI overhaul: two-column recipe grid, improved navbar, and responsive design
- Expanded healthy living recommendations to 50+ tips
- Dynamic healthy recipes page: loads recipes directly from the database
- Recipe search and suggestions now available on all pages
- One-click recipe ingredient population with automatic redirect to main page
- Improved dark mode support for all components
- Scrollable, sorted recipe suggestion lists with match percentage
- Ingredient deduplication and database cleanup tools
- Enhanced error handling and user feedback
- Codebase refactor: modularized scripts and configuration
- Various bug fixes and performance improvements

### Version 1.0.0

- Initial release
- Desktop application support
- Dark mode with persistence
- Real-time ingredient suggestions
- Nutritional calculations