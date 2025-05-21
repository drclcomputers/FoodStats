// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

const API_BASE = (() => {
    const isElectron = typeof window !== 'undefined' &&
        window.process?.type &&
        process?.versions?.electron;
    
    const isRender = window.location.hostname.includes('.onrender.com');
    const renderBackendUrl = 'https://foodstats-backend.onrender.com/api';
    
    if (isElectron) {
        return 'http://localhost:8080/api';
    } else if (isRender) {
        return renderBackendUrl;
    } else {
        return 'http://localhost:8080/api';
    }
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
        const isRender = window.location.hostname.includes('.onrender.com');
        if (!isRender) {
            const isHealthy = await checkServerHealth();
            if (!isHealthy) {
                showToast("Server health check failed. Please try again later.");
                throw new Error("Server is not healthy. Health check failed.");
            }
        }

        options.headers = {
            ...options.headers,
            "X-Session-ID": SESSION_ID,
            "Content-Type": "application/json",
        };

        options.credentials = "include";

        const response = await fetch(path, options);
        if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message =
            errorData?.message || `HTTP error! Status: ${response.status}`;
        showToast(`Request failed: ${message}`);
        throw new Error(
            `HTTP error! status: ${response.status}, message: ${message}`
        );
        }
        return response;
    } catch (error) {
        console.error("Fetch error details:", error.message);
        if (
        error.message !== "Server is not healthy. Health check failed." &&
        !error.message.startsWith("HTTP error!")
        ) {
        showToast("A connection error occurred. Please check your network.");
        }
        throw error;
    }
}

function showToast(message, duration = 3000) {
    let container = document.querySelector(".toast-container");
    if (!container) {
        container = document.createElement("div");
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "toast";
    
    const content = document.createElement("div");
    content.className = "toast-content";
    content.innerHTML = message;
    
    const closeBtn = document.createElement("button");
    closeBtn.className = "toast-close";
    closeBtn.innerHTML = "×";
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        toast.style.animation = "toastOut 0.3s ease forwards";
        
        const handleClose = () => {
            if (container.contains(toast)) {
                toast.remove();
            }
            if (container.children.length === 0 && document.body.contains(container)) {
                container.remove();
            }
        };
        
        toast.addEventListener("animationend", handleClose, { once: true });
        setTimeout(handleClose, 350);
    };
    
    toast.appendChild(content);
    toast.appendChild(closeBtn);
    container.appendChild(toast);

    setTimeout(() => {
        if (!container.contains(toast)) return;
        
        toast.style.animation = "toastOut 0.3s ease forwards";

        const onAnimationEnd = () => {
            if (container.contains(toast)) {
                toast.remove();
            }
            if (container.children.length === 0 && document.body.contains(container)) {
                container.remove();
            }
        };

        toast.addEventListener("animationend", onAnimationEnd, { once: true });

        setTimeout(() => {
            if (container.contains(toast) || 
                (container.children.length === 0 && document.body.contains(container))) {
                onAnimationEnd();
            }
        }, 350);
    }, duration);
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
    
    checkUserProfile();
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

async function checkUserProfile() {
    if (window.location.pathname.includes('profile.html')) {
        return;
    }
    
    const localProfile = localStorage.getItem('userProfile');
    if (localProfile) {
        const profileData = JSON.parse(localProfile);
        if (profileData && profileData.age) {
            return;
        }
    }
    
    try {
        const response = await fetchWithSession(`${API_BASE}/getprofile`);
        const data = await response.json();
        
        if (data && data.age) {
            localStorage.setItem('userProfile', JSON.stringify(data));
            return;
        }
        showToast("📝 Complete your profile for personalized nutrition advice! <a href='profile.html' style='color:white;text-decoration:underline;'>Go to Profile</a>", 7000);
    } catch (error) {
        console.error("Error checking user profile:", error);
    }
}

