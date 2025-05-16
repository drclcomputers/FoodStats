window.onscroll = function() {
    const btn = document.getElementById('scrollTop');
    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
        btn.style.display = 'block';
    } else {
        btn.style.display = 'none';
    }
};

document.getElementById('scrollTop').onclick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};