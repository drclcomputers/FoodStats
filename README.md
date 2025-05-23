# 🥗 FoodStats

A modern desktop application for tracking nutritional information and discovering healthy recipes. Built with Electron and Go for a seamless, cross-platform desktop experience.

---

## 📋 Features

- **AI-Powered Analysis**
  - Smart recipe suggestions based on ingredients
  - Nutritional analysis with AI health scoring
  - Intelligent ingredient matching
  - AI-driven dietary recommendations
  - Personalized meal suggestions

- **Recipe Management**
  - Create and save custom recipes
  - Import/Export recipe functionality
  - Search through recipe database
  - Real-time ingredient suggestions
  - Dynamic recipe matching

- **Nutrition Tracking**
  - Detailed nutritional breakdown
  - Calorie and macro calculation
  - Dietary goals monitoring
  - Visual nutrition charts
  - Progress tracking

- **User Experience**
  - Modern, responsive design
  - Dark/Light mode support
  - Smooth animations
  - Cross-platform compatibility
  - Intuitive interface

- **Security Features**
  - Input validation & sanitization
  - XSS attack prevention
  - SQL injection protection
  - Rate limiting
  - Secure data handling

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

### Prerequisites

- **Node.js** (v18+ recommended)
- **Go** (v1.24+)
- **Python** (>=3.11, recommended 3.11.x)
- **pip** (for Python)
- **Git** (for cloning the repository)

### Development Setup

1. **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/FoodStats.git
    cd FoodStats
    ```

2. **Install Node.js dependencies**
    ```bash
    npm install
    ```

3. **Install Python dependencies**
    ```bash
    pip3 install --no-cache-dir -r backend/requirements.txt
    ```
    > If you get an error, make sure Python 3.11+ and pip are installed and available in your PATH.

4. **Build the Go backend**
    ```bash
    cd backend
    # On Windows
    go build -o FoodStats.exe
    # On Linux/Mac
    go build -o FoodStats
    cd ..
    ```

5. **Run in development mode**
    ```bash
    npm start
    ```

---

### One-Step Install 

## (Linux/Mac)

You can use the provided [`install.sh`](install.sh) script for a quick setup:

```bash
chmod +x install.sh
./install.sh
```

## (Windows)

YOu can download the latest release and install it. When starting, the app will try to install the python dependencies required for AI using pip.



### Production Build (Desktop App)

1. **Build the application**
    ```bash
    npm run dist
    ```

2. **Install the application**
    - Go to the `dist` folder
    - Run the installer (`.exe` for Windows, `.AppImage` or `.deb` for Linux)

**On launch, the app will attempt to install Python dependencies automatically. If you see errors about missing Python or pip, please install [Python 3.11+](https://www.python.org/downloads/) and [pip](https://pip.pypa.io/en/stable/installation/), then re-run the app.**

---


## 🌐 API Endpoints

- `GET /api/ingredients` - List all ingredients
- `POST /api/addingredient` - Add a new ingredient
- `DELETE /api/deleteingredient` - Remove an ingredient
- `GET /api/calculate` - Calculate total nutrition
- `GET /api/suggestions` - Get ingredient suggestions
- `DELETE /api/reset` - Reset ingredient list
- `GET /api/listrecipes` - List all recipes
- `GET /api/getrecipe?name=...` - Get a recipe by name
- `GET /api/suggestrecipes` - Suggest recipes based on current ingredients
- `POST /api/analyzenutrition` - Get AI-powered nutritional analysis
- `POST /api/saveprofile` - Save user profile data
- `GET /api/getprofile` - Retrieve user profile data
- `DELETE /api/resetprofile` - Delete user profile data

---

## 📱 Screenshots

![FoodStats Main Interface](/assets/img.png)
![FoodStats Healthy Recipes](/assets/img_1.png)
![FoodStats AI Suggestions](/assets/img_2.png)
![FoodStats Recommendations](/assets/img_3.png)
![FoodStats Healthy Recipes](/assets/img_4.png)
![FoodStats My Profile](/assets/img_5.png)

---

## 💻 System Requirements (Desktop App)

- Windows 10 or later / Linux (Ubuntu 20.04 or later recommended)
- 4GB RAM minimum (8GB+ recommended)
- 500MB disk space
- Internet connection for installation
- Python >=3.11 for AI recommendations

---

## 🔧 Configuration

The application stores its settings in:
- Dark mode preference: LocalStorage
- Database: SQLite file in the application directory
- Server: Automatically managed by Electron

---

## 🐍 Python Requirements

The AI recommendation system requires the following Python packages:
```
numpy>=1.24.3
pandas>=1.5.3
scikit-learn>=1.2.2
```
These are installed automatically at first launch of the packaged app, or manually with:
```bash
pip3 install --no-cache-dir -r backend/requirements.txt
```

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

### Version 4.4.0

- **UI/UX Improvements**
  - Fade-in animation on page load for a smoother experience
  - Improved mobile navigation: better touch feedback, clearer active/hover states, and horizontal nav layout option
  - Enhanced dark mode contrast for navigation and menus
  - More visible toast notifications and improved error feedback

- **Performance & Stability**
  - Faster ingredient and recipe list updates
  - Optimized frontend code for better responsiveness

- **Bug Fixes**
  - Fixed nav item color issues in both light and dark mode
  - Resolved issues with AI suggestions tab visibility
  - Fixed export/import edge cases and improved error handling

- **Miscellaneous**
  - Updated dependencies (Electron, builder tools)
  - Minor code cleanup and documentation updates

### Version 4.2.0

- **Improved Import/Export**
  - Unified export/import for ingredient lists with better error handling and user feedback
  - Import now resets the ingredient list and updates the recipe source indicator
  - Exported files are named for clarity and include all ingredient details

- **Recipe Source Tracking**
  - Persistent display of the current recipe source (manual, imported, or from database)
  - Source is cleared automatically when all ingredients are deleted

- **Enhanced Recipe Integration**
  - "Use Recipe" from suggestions and healthy recipes now imports all ingredients and updates the UI
  - Skipped ingredients are reported to the user via toast notifications

- **UI/UX Improvements**
  - Improved mobile responsiveness and touch support
  - More accessible navigation and larger clickable areas for mobile
  - Consistent button styles and hover effects across all pages
  - Improved toast notification system with dismiss controls and batching

- **Performance and Stability**
  - Faster ingredient list rendering and deletion animations
  - Optimized fetch and update cycles for ingredient and recipe operations
  - More robust error handling for backend/API failures

- **Security and Validation**
  - Stricter input validation for ingredient names and grams
  - Improved error messages for invalid or duplicate ingredients
  - Minor backend security patches and dependency updates

- **Documentation and Help**
  - Updated README and user manual to clarify import/export limitations (ingredients only)
  - Added more troubleshooting tips for cloud and desktop
  - Added new screenshots for mobile and desktop

- **Miscellaneous**
  - Updated dependencies for Electron and builder tools
  - Minor bug fixes and code cleanup

### Version 4.0.0

- **Personalized Profile System**
  - User profiles with age, gender, weight, height, and activity level
  - Dietary preference tracking (vegetarian, vegan, gluten-free, etc.)
  - Personalized calorie and macronutrient recommendations
  - Custom nutritional advice based on user characteristics
  - Profile reset functionality with confirmation

- **Enhanced AI Analysis**
  - Personalized nutritional feedback based on user profile
  - Improved recipe recommendations considering dietary preferences
  - Custom macronutrient targets based on fitness goals
  - Context-aware suggestions based on user activity level
  - More accurate health scoring based on individual needs

- **Improved User Experience**
  - Better toast notification system with dismiss controls
  - Improved file import/export functionality
  - Enhanced recipe source tracking
  - Dark mode support for all new components
  - Smart reminder system for profile completion

- **Backend Improvements**
  - Session-based profile storage
  - Enhanced security for personal data
  - Middleware improvements for API stability
  - Cloud compatibility for potential Render.com hosting
  - Performance optimizations for ML components

### Version 3.0.0

- **Enhanced Security Implementation**
    - Input validation and sanitization for all forms
    - SQL injection protection via prepared statements
    - XSS attack prevention with content security policies
    - Rate limiting to prevent DOS attacks
    - Secure headers implementation

- **Advanced UI Animations**
    - Scroll-triggered animations for recommendations
    - Staggered card reveal animations
    - Smooth transitions between states
    - Improved loading states and feedback
    - Enhanced mobile responsiveness

- **Modernized Interface**
    - Redesigned recipe cards with hover effects
    - Updated recommendations layout
    - Improved dark mode consistency
    - Enhanced typography and spacing
    - Better visual hierarchy

- **Performance Optimizations**
    - Optimized animation performance
    - Improved scroll handling
    - Better state management
    - Enhanced data validation
    - Reduced code duplication

- **Quality of Life Improvements**
    - Persistent recipe source across page navigation
    - Improved AI suggestions visibility
    - Better error messages and user feedback
    - Enhanced cross-browser compatibility
    - Updated documentation

### Version 2.2.0

- Added smooth animations throughout the application
    - Ingredient deletion animations
    - Recipe suggestions show/hide animations
    - Loading spinners with animations
    - Scroll-to-top button transitions
- Implemented toast notifications system
    - Replaced all alert boxes with non-intrusive toasts
    - Success/error feedback for all user actions
    - Auto-dismissing notifications
- Enhanced user feedback
    - Visual loading states for calculations
    - Improved error handling with friendly messages
    - Recipe source display showing current context
- UI/UX improvements
    - Better mobile responsiveness
    - Smoother dark mode transitions
    - Consistent styling across all pages
- Bug fixes
    - Fixed recipe suggestion animations
    - Improved import/export functionality
    - Enhanced cross-browser compatibility

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