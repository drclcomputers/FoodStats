function initializeDarkMode() {
    const toggleDarkModeButton = document.getElementById("toggleDarkMode");
    const body = document.body;

    toggleDarkModeButton.addEventListener("click", function() {
        body.classList.toggle("dark-mode");

        if (body.classList.contains("dark-mode")) {
            toggleDarkModeButton.textContent = "☀️ Toggle Light Mode";
        } else {
            toggleDarkModeButton.textContent = "🌙 Toggle Dark Mode";
        }
    });
}

document.addEventListener('DOMContentLoaded', initializeDarkMode);