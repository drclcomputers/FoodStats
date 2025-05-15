// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

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