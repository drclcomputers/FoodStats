function initializeDarkMode() {
    const toggleDarkModeButton = document.getElementById("toggleDarkMode");
    const body = document.body;

    const isDarkMode = localStorage.getItem('darkMode') === 'true';

    if (isDarkMode) {
        body.classList.add('dark-mode');
        toggleDarkModeButton.textContent = "☀️ Toggle Light Mode";
    }

    toggleDarkModeButton.addEventListener("click", function() {
        body.classList.toggle("dark-mode");

        if (body.classList.contains("dark-mode")) {
            toggleDarkModeButton.textContent = "☀️ Toggle Light Mode";
            localStorage.setItem('darkMode', 'true');
        } else {
            toggleDarkModeButton.textContent = "🌙 Toggle Dark Mode";
            localStorage.setItem('darkMode', 'false');
        }
    });
}

document.addEventListener('DOMContentLoaded', initializeDarkMode);