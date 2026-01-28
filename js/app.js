let portfolioData = null;
let currentLang = localStorage.getItem('pref-lang') || 'pt';

$(document).ready(function () {
    loadPortfolioData();
    $("#hamburgerBtn").click(() => $("#navLinks").toggleClass("open"));
    $(".nav-links a").click(() => $("#navLinks").removeClass("open"));

    const themes = ["theme-purple", "theme-cyan", "theme-green"];
    let savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
        document.documentElement.classList.add(savedTheme);
        $(`input[name="theme"][value="${savedTheme}"]`).prop("checked", true);
    }
    $('input[name="theme"]').change(function () {
        const val = $(this).val();
        themes.forEach(t => document.documentElement.classList.remove(t));
        document.documentElement.classList.add(val);
        localStorage.setItem("theme", val);
    });
    $('#subject').select2({ dropdownCssClass: 'dark-dropdown' });
});

async function loadPortfolioData() {
    try {
        const response = await fetch('data/portfolio.json');
        portfolioData = await response.json();
        render();
    } catch (e) { console.error(e); }
}

function render() {
    if (!portfolioData) return;
    const t = portfolioData.translations[currentLang];
    const c = portfolioData.content;

    $('#lang-selector').html(`<a style="cursor:pointer" onclick="switchLanguage('${currentLang === 'pt' ? 'en' : 'pt'}')" class="btn-lang">
        <img src="https://flagcdn.com/w20/${currentLang === 'pt' ? 'us' : 'br'}.png"></a>`);

    $('[data-i18n]').each(function () {
        const key = $(this).data('i18n');
        if (t[key]) $(this).html(t[key]);
    });

    $('label[for="name"]').text(t.form_name);
    $('label[for="email"]').text(t.form_email);
    $('label[for="subject"]').text(t.form_subject);
    $('label[for="message"]').text(t.form_message);
    $('.btn-submit').html(`${t.form_btn} <i class="fa fa-paper-plane"></i>`);

    $('#about .section-title').text(c.about.title[currentLang]);
    $('.about-text').html(c.about.paragraphs.map(p => `<p>${p[currentLang]}</p>`).join(''));
    $('.stats-grid').html(c.about.stats.map(s => `<div class="stat-card"><b>${s.number}</b><br>${s.label[currentLang]}</div>`).join(''));
    $('#expertise .section-title').text(c.expertise.title[currentLang]);
    $('.services-grid').html(c.expertise.cards.map(card => `<div class="service-card"><i class="fa ${card.icon}"></i><h3>${card.title[currentLang]}</h3><p>${card.text[currentLang]}</p></div>`).join(''));

    const grids = { mobile: $('#grid-mobile'), web: $('#grid-web'), article: $('#grid-article'), video: $('#grid-video') };
    Object.values(grids).forEach(g => g.empty());

    portfolioData.items.forEach(item => {
        const html = `
            <article class="project-card ${item.featured ? 'span-2' : ''}">
                <div class="project-content">
                    <span class="project-type"><i class="fa ${item.icon}"></i> ${item.tech}</span>
                    <h3>${item.title[currentLang]}</h3>
                    <p>${item.desc[currentLang]}</p>
                    <br/>
                    <div class="project-links">${generateLinks(item.links, t)}</div>
                </div>
            </article>`;
        grids[item.category]?.append(html);
    });
}

function generateLinks(links, t) {
    let h = '';
    const s = 'style="color:#000 !important"';
    if (links.playstore) h += `<a href="${links.playstore}" target="_blank"><i class="fa-brands fa-google-play"></i></a>`;
    if (links.appstore) h += `<a href="${links.appstore}" target="_blank"><i class="fa-brands fa-apple"></i></a>`;
    if (links.youtube) h += `<button onclick="openVideo('${links.youtube}')" class="btn-link" ${s}><i class="fa fa-play-circle" ${s}></i> ${t.btn_demo}</button>`;
    if (links.news) h += `<a href="${links.news}" target="_blank" class="btn-link" ${s}><i class="fa fa-newspaper" ${s}></i> ${t.btn_article}</a>`;
    if (links.pdf) h += `<a href="${links.pdf}" target="_blank" class="btn-link" ${s}><i class="fa fa-file-pdf" ${s}></i> PDF</a>`;
    if (links.url) {
        const icon = links.url.includes('linkedin') ? 'fa-brands fa-linkedin' : 'fa-book-open';
        h += `<a href="${links.url}" target="_blank" class="btn-link" ${s}><i class="fa ${icon}" ${s}></i> ${t.btn_read}</a>`;
    }
    return h;
}

function switchLanguage(l) { currentLang = l; localStorage.setItem('pref-lang', l); render(); }
const modal = document.getElementById('videoModal');
const videoFrame = document.getElementById('videoFrame');
function openVideo(id) { modal.style.display = 'flex'; videoFrame.src = `https://www.youtube.com/embed/${id}?autoplay=1`; }
function closeVideo() { modal.style.display = 'none'; videoFrame.src = ''; }
window.onclick = (e) => { if (e.target == modal) closeVideo(); };