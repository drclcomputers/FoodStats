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
            'X-Session-ID': SESSION_ID,
            'Content-Type': 'application/json',
        };

        options.credentials = 'same-origin';

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
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => {
            if (container.contains(toast)) {
                toast.remove();
            }
            if (container.children.length === 0) {
                container.remove();
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
        const response = await fetch(`${API_BASE}/health`, {
            headers: {
                'X-Session-ID': SESSION_ID,
                'Content-Type': 'application/json',
            }
        });
        console.log('Health check response:', response);
        const data = await response.json();
        return data.status === 'ok' && data.services.database === 'ok';
    } catch (error) {
        console.error('Health check failed:', error);
        return false;
    }
}



