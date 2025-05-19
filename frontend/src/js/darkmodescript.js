// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

function initializeDarkMode() {
    const toggleButton = document.getElementById("toggleDarkMode");
    if (!toggleButton) return;

    const body = document.body;

    const savedPreference = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = savedPreference !== null ? savedPreference === "true" : prefersDark;

    const applyMode = (isDark) => {
        body.classList.toggle("dark-mode", isDark);
        toggleButton.textContent = isDark ? "☀️ Toggle Light Mode" : "🌙 Toggle Dark Mode";
    };

    applyMode(shouldUseDark);

    toggleButton.addEventListener("click", () => {
        const isDark = body.classList.toggle("dark-mode");
        localStorage.setItem("darkMode", isDark.toString());
        toggleButton.textContent = isDark ? "☀️ Toggle Light Mode" : "🌙 Toggle Dark Mode";
    });
}

document.addEventListener("DOMContentLoaded", initializeDarkMode);