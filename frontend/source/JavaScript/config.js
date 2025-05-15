const API_BASE = (() => {
    if (window.process && process.versions['electron']) {
        return 'http://localhost:8080/api';
    }
    return 'https://foodstats-backend.onrender.com/api';
})();

