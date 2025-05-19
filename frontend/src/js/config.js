// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

const API_BASE = (() => {
    const isElectron = typeof window !== 'undefined' &&
        window.process?.type &&
        process?.versions?.electron;

    return isElectron
        ? 'http://localhost:8080/api'
        : 'https://foodstats-backend.onrender.com/api';
})();

const SESSION_ID = (() => {
    let sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('session_id', sessionId);
    }
    return sessionId;
})();

async function fetchWithSession(path, options = {}) {
    try {
        const isHealthy = await checkServerHealth();
        if (!isHealthy) {
            throw new Error('Server is not healthy');
        }

        options.headers = {
            ...options.headers,
            'X-Session-ID': SESSION_ID
        };

        const response = await fetch(path, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
    } catch (error) {
        console.error('Fetch error:', error);
        showToast('Server connection error');
        throw error;
    }
}

function showToast(message) {
    const toasts = JSON.parse(localStorage.getItem('toasts') || '[]');
    toasts.push({
        message,
        timestamp: new Date().getTime()
    });
    localStorage.setItem('toasts', JSON.stringify(toasts));

    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    const toasts = JSON.parse(localStorage.getItem('toasts') || '[]');
    const currentTime = new Date().getTime();

    const recentToasts = toasts.filter(toast => {
        return currentTime - toast.timestamp < 5000;
    });

    recentToasts.forEach(toast => {
        showToast(toast.message);
    });

    localStorage.setItem('toasts', '[]');
});

async function checkServerHealth() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        return data.status === 'ok' && data.db === 'ok';
    } catch (error) {
        console.error('Health check failed:', error);
        return false;
    }
}
