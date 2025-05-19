// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

let lastScrollPosition = window.pageYOffset;

function checkRecommendationsVisibility() {
    const articles = document.querySelectorAll('.recommendations-list article');
    const windowHeight = window.innerHeight;
    const currentScroll = window.pageYOffset;
    const scrollingDown = currentScroll > lastScrollPosition;

    articles.forEach((article, index) => {
        if (index < 4) return;

        const rect = article.getBoundingClientRect();

        if (rect.top < windowHeight * 0.8 && rect.bottom > 0) {
            article.classList.remove('hidden');
            article.classList.add('visible');
        }
        else if (rect.top > windowHeight && scrollingDown) {
            article.classList.remove('visible');
            article.classList.add('hidden');
        }
        else if (rect.bottom < 0 && !scrollingDown) {
            article.classList.remove('visible');
            article.classList.add('hidden');
        }
    });

    lastScrollPosition = currentScroll;
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

window.addEventListener('scroll', throttle(checkRecommendationsVisibility, 100));
document.addEventListener('DOMContentLoaded', checkRecommendationsVisibility);