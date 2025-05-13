# 🥗 FoodStats

A modern web application for tracking nutritional information and discovering healthy recipes.

## 📋 Features

- **Real-time Nutrition Tracking**
    - Add ingredients with quantities
    - Auto-complete ingredient suggestions
    - Calculate total nutritional values
    - Track calories, proteins, carbs, fats, and fiber

- **Responsive Design**
    - Mobile-friendly interface
    - Desktop optimized layout
    - Dark/Light mode support

- **Recipe Resources**
    - Healthy recipe suggestions
    - Nutritional recommendations
    - Lifestyle tips

## 🚀 Tech Stack

### Frontend
- HTML5
- CSS3 (with responsive design)
- JavaScript (Vanilla)
- Custom dark mode implementation

### Backend
- Go (v1.24)
- SQLite3 database
- RESTful API architecture

## 🛠 Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/FoodStats.git
cd FoodStats
```

2. **Start the backend server**
```bash
cd backend
go run main.go
```

3. **Open the frontend**
- Navigate to the `frontend` directory
- Open `index.html` in your web browser
- Or use a local server:
```bash
python -m http.server 8000
```

## 🌐 API Endpoints

- `GET /api/ingredients` - List all ingredients
- `POST /api/add-ingredient` - Add a new ingredient
- `DELETE /api/delete-ingredient` - Remove an ingredient
- `GET /api/calculate` - Calculate total nutrition
- `GET /api/suggestions` - Get ingredient suggestions
- `DELETE /api/reset` - Reset ingredient list

## 📱 Screenshots

![Alt text](/README%20RESOURCES/img.png)
![Alt text](/README%20RESOURCES/img_1.png)

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 👤 Author

@drclcomputers

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🌟 Show your support

Give a ⭐️ if this project helped you!