// Mobile navigation toggle
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');

function setNav(open) {
  toggle.setAttribute('aria-expanded', String(open));
  toggle.querySelector('.visually-hidden').textContent = open ? 'Close menu' : 'Open menu';
  nav.classList.toggle('is-open', open);
}

toggle.addEventListener('click', () => {
  setNav(toggle.getAttribute('aria-expanded') !== 'true');
});

// Close the menu after choosing a link
nav.addEventListener('click', (e) => {
  if (e.target.closest('a')) setNav(false);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav.classList.contains('is-open')) {
    setNav(false);
    toggle.focus();
  }
});

// Header border once the page scrolls
const header = document.querySelector('.site-header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Menu tabs
const tabList = document.querySelector('.menu-tabs');
if (tabList) {
  const tabs = [...tabList.querySelectorAll('.menu-tab')];
  const indicator = tabList.querySelector('.menu-tab-indicator');

  // let the drawings "sketch" themselves: normalise every stroke to length 1
  document.querySelectorAll('.menu-art path, .menu-art rect')
    .forEach((el) => el.setAttribute('pathLength', '1'));

  // stagger index for each menu row
  document.querySelectorAll('.menu-list').forEach((list) => {
    [...list.children].forEach((li, i) => li.style.setProperty('--i', i));
  });

  const moveIndicator = (tab) => {
    indicator.style.width = `${tab.offsetWidth}px`;
    indicator.style.transform = `translateX(${tab.offsetLeft}px)`;
  };

  const select = (tab, { focus = false } = {}) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).classList.toggle('is-active', on);
    });
    moveIndicator(tab);
    if (focus) tab.focus();
    // keep the chosen tab visible when the tab strip scrolls sideways on phones
    tabList.scrollTo({ left: tab.offsetLeft - (tabList.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' });
  };

  tabs.forEach((tab) => tab.addEventListener('click', () => select(tab)));

  tabList.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const next = {
      ArrowRight: tabs[(i + 1) % tabs.length],
      ArrowLeft: tabs[(i - 1 + tabs.length) % tabs.length],
      Home: tabs[0],
      End: tabs[tabs.length - 1],
    }[e.key];
    if (next) {
      e.preventDefault();
      select(next, { focus: true });
    }
  });

  // place the pill without animating on first paint, and again once fonts change widths
  const current = () => tabs.find((t) => t.getAttribute('aria-selected') === 'true');
  const placeQuietly = () => {
    tabList.classList.add('no-anim');
    moveIndicator(current());
    requestAnimationFrame(() => requestAnimationFrame(() => tabList.classList.remove('no-anim')));
  };
  placeQuietly();
  document.fonts?.ready.then(placeQuietly);
  window.addEventListener('resize', placeQuietly);
}

// Instagram feed
// Reads a Behold JSON feed (https://behold.so) set in data-feed on #instagram.
// Without a feed URL, or if loading fails, the grid stays hidden and only the
// Follow button shows.
const insta = document.getElementById('instagram');
const feedUrl = insta?.dataset.feed?.trim();
if (insta && feedUrl) loadInstagram(insta, feedUrl);

async function loadInstagram(section, url) {
  const grid = section.querySelector('.insta-grid');
  grid.hidden = false;
  grid.replaceChildren(...Array.from({ length: 6 }, () => {
    const li = document.createElement('li');
    li.className = 'insta-tile is-loading';
    return li;
  }));

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Feed returned ${res.status}`);
    const data = await res.json();
    // only real Instagram links, so a bad feed can't plant a javascript: link
    const posts = (Array.isArray(data) ? data : data.posts || [])
      .filter((p) => typeof p.permalink === 'string' && p.permalink.startsWith('https://www.instagram.com/'))
      .slice(0, 6);
    if (!posts.length) throw new Error('Feed has no posts');
    grid.replaceChildren(...posts.map(instaTile));
  } catch (err) {
    console.warn('Instagram feed not shown:', err.message);
    grid.hidden = true;
    grid.replaceChildren();
  }
}

function instaTile(post, i) {
  const sizes = post.sizes || {};
  const isVideo = post.mediaType === 'VIDEO';
  const src = (i === 0 ? sizes.large : sizes.medium)?.mediaUrl
    || (isVideo ? post.thumbnailUrl : post.mediaUrl);

  const li = document.createElement('li');
  li.className = 'insta-tile';
  li.style.setProperty('--i', i);

  const a = document.createElement('a');
  a.href = post.permalink;
  a.target = '_blank';
  a.rel = 'noopener';

  const img = document.createElement('img');
  img.src = src;
  img.alt = post.altText || post.prunedCaption || 'Instagram post from Koupa Cafe';
  img.loading = i < 3 ? 'eager' : 'lazy';
  img.decoding = 'async';
  a.append(img);

  const kind = isVideo ? 'reel' : post.mediaType === 'CAROUSEL_ALBUM' ? 'album' : null;
  if (kind) {
    const badge = document.createElement('span');
    badge.className = 'insta-badge';
    badge.title = kind === 'reel' ? 'Video' : 'Album';
    badge.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#${kind}-icon"/></svg>`;
    a.append(badge);
  }

  if (post.prunedCaption) {
    const cap = document.createElement('span');
    cap.className = 'insta-caption';
    cap.textContent = post.prunedCaption;
    cap.setAttribute('aria-hidden', 'true'); // already used as the image alt text
    a.append(cap);
  }

  li.append(a);
  return li;
}

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();
