// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

window.onscroll = function() {
    const btn = document.getElementById('scrollTop');
    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
        btn.style.display = 'block';
    } else {
        btn.style.display = 'none';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const scrollTopBtn = document.getElementById('scrollTop');
    if (!scrollTopBtn) return;

    let isVisible = false;
    const toggleScrollBtn = () => {
        const shouldBeVisible = window.scrollY > 200;
        if (shouldBeVisible !== isVisible) {
            scrollTopBtn.classList.toggle('visible', shouldBeVisible);
            isVisible = shouldBeVisible;
        }
    };

    let throttleTimeout;
    window.addEventListener('scroll', () => {
        if (!throttleTimeout) {
            throttleTimeout = setTimeout(() => {
                toggleScrollBtn();
                throttleTimeout = null;
            }, 100);
        }
    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});