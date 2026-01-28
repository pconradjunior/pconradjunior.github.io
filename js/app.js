let portfolioData = null;
let currentLang = localStorage.getItem('pref-lang') || 'pt';

$(document).ready(function () {
    loadPortfolioData();
    $("#hamburgerBtn").click(() => $("#navLinks").toggleClass("open"));
    $(".nav-links a").click(() => $("#navLinks").removeClass("open"));

    const themes = ["theme-purple", "theme-cyan", "theme-green"];
    let savedTheme = localStorage.getItem("theme");
    if (savedTheme && themes.includes(savedTheme)) {
        document.documentElement.classList.add(savedTheme);
        $(`input[name="theme"][value="${savedTheme}"]`).prop("checked", true);
    }
    $('input[name="theme"]').change(function () {
        const selectedTheme = $(this).val();
        themes.forEach(t => document.documentElement.classList.remove(t));
        document.documentElement.classList.add(selectedTheme);
        localStorage.setItem("theme", selectedTheme);
    });
    $('#subject').select2({ dropdownCssClass: 'dark-dropdown' });
});

async function loadPortfolioData() {
    try {
        const response = await fetch('data/portfolio.json');
        portfolioData = await response.json();
        render();
    } catch (err) { console.error("Erro no fetch:", err); }
}

function render() {
    const t = portfolioData.translations[currentLang];
    const c = portfolioData.content;

    // Alternador de Idioma
    const langBtn = currentLang === 'en'
        ? `<a style="cursor: pointer" onclick="switchLanguage('pt')" class="btn-lang"><img src="https://flagcdn.com/w20/br.png" alt="PT"></a>`
        : `<a style="cursor: pointer" onclick="switchLanguage('en')" class="btn-lang"><img src="https://flagcdn.com/w20/us.png" alt="EN"></a>`;
    $('#lang-selector').html(langBtn);

    // Traduções Básicas
    $('[data-i18n]').each(function () { $(this).html(t[$(this).data('i18n')]); });
    $('label[for="name"]').text(t.form_name);
    $('label[for="email"]').text(t.form_email);
    $('label[for="subject"]').text(t.form_subject);
    $('label[for="message"]').text(t.form_message);
    $('.btn-submit').html(`${t.form_btn} <i class="fa fa-paper-plane"></i>`);

    // Conteúdo Estático (Sobre/Expertise)
    $('#about .section-title').text(c.about.title[currentLang]);
    $('.about-text').html(c.about.paragraphs.map(p => `<p>${p[currentLang]}</p>`).join(''));
    $('.stats-grid').html(c.about.stats.map(s => `<div class="stat-card"><span class="stat-number">${s.number}</span><span class="stat-label">${s.label[currentLang]}</span></div>`).join(''));
    $('#expertise .section-title').text(c.expertise.title[currentLang]);
    $('.services-grid').html(c.expertise.cards.map(card => `<div class="service-card"><div class="service-icon"><i class="fa ${card.icon}"></i></div><h3>${card.title[currentLang]}</h3><p>${card.text[currentLang]}</p></div>`).join(''));

    // Grids de Projetos
    const grids = {
        mobile: $('#grid-mobile'),
        web: $('#grid-web'),
        article: $('#grid-article'),
        article_ext: $('#grid-article-ext'),
        video: $('#grid-video')
    };
    Object.values(grids).forEach(g => g.empty());

    portfolioData.items.forEach(item => {
        const cardHtml = `
            <article class="project-card ${item.featured ? 'span-2' : ''}">
                <div class="project-content">
                    <span class="project-type"><i class="fa ${item.icon}"></i> ${item.tech}</span>
                    <h3 class="project-title">${item.title[currentLang]}</h3>
                    <p class="project-desc">${item.desc[currentLang]}</p>
                    <div class="project-links">${generateLinks(item.links, t)}</div>
                </div>
            </article>`;
        grids[item.category]?.append(cardHtml);
    });
}

function generateLinks(links, t) {
    let h = '';
    if (links.playstore) h += `<a href="${links.playstore}" target="_blank"><i class="fa-brands fa-google-play"></i></a>`;
    if (links.appstore) h += `<a href="${links.appstore}" target="_blank"><i class="fa-brands fa-apple"></i></a>`;
    if (links.youtube) h += `<button onclick="openVideo('${links.youtube}')" class="btn-link"><i class="fa fa-play-circle"></i> ${t.btn_demo || t.btn_watch}</button>`;
    if (links.news) h += `<a href="${links.news}" target="_blank" class="btn-link"><i class="fa fa-newspaper"></i> ${t.btn_article}</a>`;
    if (links.pdf) h += `<a href="${links.pdf}" target="_blank" class="btn-link"><i class="fa fa-file-pdf"></i> PDF</a>`;
    if (links.url) {
        const icon = links.url.includes('linkedin') ? 'fa-brands fa-linkedin' : 'fa-book-open';
        h += `<a href="${links.url}" target="_blank" class="btn-link"><i class="fa ${icon}"></i> ${t.btn_read}</a>`;
    }
    return h;
}

function switchLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('pref-lang', lang);
    render();
}

const modal = document.getElementById('videoModal');
const videoFrame = document.getElementById('videoFrame');
function openVideo(id) { modal.style.display = 'flex'; videoFrame.src = `https://www.youtube.com/embed/${id}?autoplay=1`; }
function closeVideo() { modal.style.display = 'none'; videoFrame.src = ''; }
window.onclick = (e) => { if (e.target == modal) closeVideo(); };