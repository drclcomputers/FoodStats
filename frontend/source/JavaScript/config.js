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

