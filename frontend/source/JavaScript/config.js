// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

const API_BASE = (() => {
    if (window.process && process.versions['electron']) {
        return 'http://localhost:8080/api';
    }
    return 'https://foodstats-backend.onrender.com/api';
})();

if (!localStorage.getItem('session_id')) {
    localStorage.setItem('session_id', crypto.randomUUID());
}
const SESSION_ID = localStorage.getItem('session_id');

function fetchWithSession(url, options = {}) {
    const urlObj = new URL(url, window.location.origin);
    urlObj.searchParams.set('session_id', SESSION_ID);
    return fetch(urlObj.toString(), options);
}

