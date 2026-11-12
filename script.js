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

// Menu animations: cards and headings rise in as they scroll into view,
// and each card's rows follow one after another
const revealEls = document.querySelectorAll('.menu-card, .menu-new, .menu-group, .menu-cats');
if (revealEls.length && 'IntersectionObserver' in window) {
  document.querySelectorAll('.menu-list, .menu-cats').forEach((list) => {
    [...list.children].forEach((li, i) => li.style.setProperty('--i', i));
  });
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      revealIO.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  revealEls.forEach((el) => { el.classList.add('reveal'); revealIO.observe(el); });
}

// Menu page: highlight the category chip for the section on screen,
// and keep that chip scrolled into view in the chip strip
const jump = document.querySelector('.menu-jump-inner');
if (jump && 'IntersectionObserver' in window) {
  const links = new Map([...jump.querySelectorAll('a')].map((a) => [a.hash.slice(1), a]));
  const visible = new Set();
  const update = () => {
    const first = [...links.keys()].find((id) => visible.has(id));
    links.forEach((a, id) => a.classList.toggle('is-current', id === first));
    const cur = links.get(first);
    if (cur) jump.scrollTo({ left: cur.offsetLeft - (jump.clientWidth - cur.offsetWidth) / 2, behavior: 'smooth' });
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id)));
    update();
  }, { rootMargin: '-140px 0px -45% 0px' });
  links.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
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
