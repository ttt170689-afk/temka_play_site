'use strict';
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const config = window.TEMKA_CONFIG || {};
  $('#copyrightYear').textContent = String(new Date().getFullYear());
  const menu = $('#mobileNav');
  const menuToggle = $('#menuToggle');
  function closeMenu() {menu.hidden = true; menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Открыть меню');}
  menuToggle.addEventListener('click', () => {
    menu.hidden = !menu.hidden;
    menuToggle.setAttribute('aria-expanded', String(!menu.hidden));
    menuToggle.setAttribute('aria-label', menu.hidden ? 'Открыть меню' : 'Закрыть меню');
  });
  menu.addEventListener('click', event => {if (event.target.closest('a')) closeMenu();});
  document.addEventListener('keydown', event => {if (event.key === 'Escape') closeMenu();});
  window.matchMedia('(min-width: 801px)').addEventListener('change', event => {if (event.matches) closeMenu();});
  function openDialog(dialog) {closeMenu(); dialog.showModal(); document.body.classList.add('modal-open');}
  $$('dialog').forEach(dialog => {
    $('[data-close]', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {if (!$('dialog[open]')) document.body.classList.remove('modal-open');});
  });
  const games = {
    temkaworld: {title: 'TemkaWorld', monogram: 'TW.', tag: 'СЮЖЕТНЫЙ ХОРРОР · КООП', description: 'Вернись в заброшенный парк аттракционов, где когда-то всё изменилось. Записка Артёма, Золотой Ключ и Секретный Бункер складываются в историю, которую предстоит раскрыть. Автор проекта — temka_play. Сюжетные приключения и кооператив находятся в разработке.', features: ['Заброшенный парк', 'Сюжет и загадки', 'Автор: temka_play']},
    fantazia: {title: 'Fantazia RP 3D', monogram: 'F.', tag: 'ФЭНТЕЗИ · РОЛЕПЛЕЙ · GODOT ENGINE', description: 'Трёхмерный фэнтези-ролеплей на Godot Engine от temka_play. Королевство, где игроки смогут выбирать роль, объединяться во фракции и писать общую историю. Торговля, репутация и жизнь сообщества — часть задуманного мира. Проект развивается; состав возможностей ещё может измениться.', features: ['Godot Engine', '3D-моделирование', 'Фэнтези-королевство', 'Автор: temka_play']}
  };
  $$('[data-game]').forEach(button => button.addEventListener('click', () => {
    const game = games[button.dataset.game]; if (!game) return;
    $('#gameTitle').textContent = game.title;
    $('#gameModalTag').textContent = game.tag;
    $('#gameDescription').textContent = game.description;
    $('#gameModalArt').textContent = game.monogram;
    $('#gameFeatures').replaceChildren(...game.features.map(text => {const span = document.createElement('span'); span.textContent = text; return span;}));
    openDialog($('#gameDialog'));
  }));
  $('#gameToLauncher').addEventListener('click', () => {
    $('#gameDialog').close(); const section = $('#launcher');
    section.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    section.setAttribute('tabindex', '-1'); section.focus({preventScroll: true});
  });
  const repository = /^[\w.-]+\/[\w.-]+$/.test(config.repository || '') ? config.repository : 'ttt170689-afk/TEMKALAUCHER';
  const prefix = `https://github.com/${repository}/releases/download/`;
  function validDownload(url, pattern) {
    try {const u = new URL(url); return u.protocol === 'https:' && u.hostname === 'github.com' && !u.username && !u.password && u.href.startsWith(prefix) && pattern.test(u.pathname);}
    catch {return false;}
  }
  const windowsPattern = /\/TemkaLauncher-Setup-[\w.-]+-x64\.exe$/;
  const linuxPattern = /\/TemkaLauncher-[\w.-]+-(?:x64|x86_64)\.AppImage$/;
  function applyRelease(version, bytes, url) {
    if (!validDownload(url, windowsPattern) || typeof version !== 'string' || version.length > 35 || !/^v?\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(version)) return;
    $$('[data-download]').forEach(node => {node.href = url;});
    $$('[data-version]').forEach(node => {node.textContent = version.startsWith('v') ? version : `v${version}`;});
    if (Number.isFinite(bytes) && bytes > 0) $$('[data-size]').forEach(node => {node.textContent = `${Math.round(bytes / 1024 / 1024)} МБ`;});
  }
  applyRelease(config.fallbackVersion, config.fallbackBytes, config.fallbackDownload);
  async function updateRelease() {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 6500);
    try {
      const response = await fetch(`https://api.github.com/repos/${repository}/releases/latest?temka_check=${Date.now()}`, {cache: 'no-store', headers: {'Accept': 'application/vnd.github+json'}, signal: controller.signal});
      if (!response.ok) return;
      const release = await response.json();
      if (release.draft || release.prerelease || !Array.isArray(release.assets)) return;
      const installer = release.assets.find(asset => validDownload(asset.browser_download_url, windowsPattern));
      if (installer) applyRelease(release.tag_name, installer.size, installer.browser_download_url);
      const linux = release.assets.find(asset => validDownload(asset.browser_download_url, linuxPattern));
      if (linux) {
        const link = $('[data-linux-download]'); link.href = linux.browser_download_url; link.textContent = 'Скачать для Linux · AppImage x64';
        $('[data-linux-status]').textContent = 'Linux x64. Пакет .deb и остальные файлы — на странице релиза GitHub.';
      }
    } catch { /* Preserve verified Windows fallback; never invent an unpublished Linux link. */ }
    finally {clearTimeout(timer);}
  }
  updateRelease();
  try {
    const telegram = new URL(config.telegramUrl || '');
    if (telegram.protocol === 'https:' && telegram.hostname === 't.me' && !telegram.username && !telegram.password && /^\/[A-Za-z0-9_+/-]+$/.test(telegram.pathname)) {
      $$('[data-telegram], [data-community]').forEach(link => {link.href = telegram.href; link.hidden = false;});
      $('[data-community-label]').textContent = 'Канал в Telegram';
    }
  } catch { /* Keep the explicit official channel from HTML. */ }
})();
