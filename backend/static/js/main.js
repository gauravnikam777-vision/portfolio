(function () {
  'use strict';

  const API = '/api';

  // Global fallbacks
  const FALLBACK = {
    projects: [
      { id: 1, title: 'Sales Forecasting Engine', category: 'Machine Learning', description: 'LSTM networks for monthly sales predictions.', status: 'completed', technologies: ['Python', 'TensorFlow', 'pandas'] },
      { id: 2, title: 'Telecom Churn Dashboard', category: 'Data Analytics', description: 'Power BI report analyzing subscriber loss patterns.', status: 'completed', technologies: ['Power BI', 'SQL', 'DAX'] },
      { id: 3, title: 'SQL Query Optimizer', category: 'Software Dev', description: 'Rule-based parse-tree optimizer in Python.', status: 'completed', technologies: ['Python', 'SQL', 'AST'] }
    ],
    skills: {
      'Programming & Database': [
        { name: 'Python', level: 'Advanced', proficiency: 90, icon: '🐍' },
        { name: 'SQL (PostgreSQL)', level: 'Advanced', proficiency: 85, icon: '💾' }
      ],
      'Analytics & BI': [
        { name: 'Power BI', level: 'Intermediate', proficiency: 80, icon: '📊' },
        { name: 'Excel (Advanced)', level: 'Advanced', proficiency: 88, icon: '📈' }
      ]
    },
    education: [
      { degree: 'Master of Computer Applications', institution: 'Sinhgad Institute of Management', year_range: '2024 – 2026', description: 'Data structures, database management, and soft skills.' }
    ],
    certifications: [
      { title: 'Google Advanced Data Analytics', issuer: 'Coursera', year: '2024' }
    ],
    testimonials: [
      { author_name: 'Academic Coordinator', author_title: 'Sinhgad Institute', quote: 'A dedicated student with exceptional analytical skill.', avatar_initial: 'AC' }
    ]
  };

  // Helper query selectors
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function escapeHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  async function safeFetch(endpoint, fallback) {
    try {
      const res = await fetch(API + endpoint);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      return fallback;
    }
  }

  // -----------------------------------------------------------------
  // Theme System
  // -----------------------------------------------------------------
  let currentPalette = 'neon';
  let currentMode = localStorage.getItem('theme_mode') || 'dark';

  function initTheme() {
    const root = document.documentElement;
    const btn = $('#theme-toggle');
    if (!btn) return;

    const sync = () => {
      root.setAttribute('data-theme', `${currentPalette}-${currentMode}`);
      btn.innerHTML = currentMode === 'dark' ? '☀️ LIGHT' : '☾ DARK';
      btn.setAttribute('aria-label', currentMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    };

    // Initial theme set
    sync();

    btn.addEventListener('click', () => {
      currentMode = currentMode === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme_mode', currentMode);
      sync();
    });
  }

  // -----------------------------------------------------------------
  // Toast notifications
  // -----------------------------------------------------------------
  function toast(message, type = 'success', timeout = 4500) {
    const stack = $('#toast-stack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span><span>${message}</span>`;
    stack.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(20px)';
      setTimeout(() => el.remove(), 250);
    }, timeout);
  }

  // -----------------------------------------------------------------
  // Interactive / Form helper placeholders (reverted floating labels)
  // -----------------------------------------------------------------

  // -----------------------------------------------------------------
  // Mobile drawer
  // -----------------------------------------------------------------
  function initMobileNav() {
    const trigger = $('#hamburger');
    const overlay = $('#drawer-overlay');
    const drawer = $('#mobile-drawer');
    const links = $$('a', drawer);

    if (!trigger || !drawer) return;

    const close = () => {
      drawer.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      trigger.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    };
    const open = () => {
      drawer.classList.add('open');
      if (overlay) overlay.classList.add('open');
      trigger.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    };

    trigger.addEventListener('click', () => {
      drawer.classList.contains('open') ? close() : open();
    });
    if (overlay) overlay.addEventListener('click', close);
    links.forEach(l => l.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  // -----------------------------------------------------------------
  // Scroll effects & Active section highlight
  // -----------------------------------------------------------------
  function initScrollEffects() {
    const nav = $('nav');
    const sections = $$('section[id]');
    const navLinks = $$('.nav-links a[href^="#"]');
    const dotLinks = $$('.scroll-nav-indicator a[href^="#"]');
    const progressBar = $('#scroll-progress');
    const backToTop = $('#back-to-top');

    if (backToTop) {
      backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      if (nav) nav.classList.toggle('scrolled', scrollY > 40);
      if (backToTop) backToTop.classList.toggle('show', scrollY > 400);

      // Scroll progress
      if (progressBar) {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
        progressBar.style.width = pct + '%';
      }

      let current = '';
      sections.forEach(s => {
        const rect = s.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
          current = s.getAttribute('id');
        }
      });

      if (scrollY < 100) {
        current = 'hero';
      }

      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
      });

      dotLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
      });

      // Update ID card nav links active state
      const idCardNavLinks = $$('.id-card-nav-link');
      idCardNavLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
      });
    });
  }

  function initRevealOnScroll() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    // Observe initially loaded reveal elements
    $$('.reveal').forEach(el => observer.observe(el));

    // Automatically observe any dynamically added reveal elements
    const mutObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList.contains('reveal')) {
              observer.observe(node);
            }
            node.querySelectorAll('.reveal').forEach(el => observer.observe(el));
          }
        });
      });
    });
    mutObserver.observe(document.body, { childList: true, subtree: true });
  }

  // -----------------------------------------------------------------
  // Content rendering
  // -----------------------------------------------------------------
  let allProjects = [];
  let showAllProjects = false;

  function renderProjects(projects) {
    allProjects = projects;
    const cats = ['All', ...new Set(projects.map(p => p.category))];
    const filterRow = $('#project-filters');
    if (filterRow) {
      filterRow.innerHTML = cats.map((c, i) =>
        `<button class="filter-btn${i === 0 ? ' active' : ''}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`
      ).join('');

      filterRow.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        $$('.filter-btn', filterRow).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.cat;
        showAllProjects = false;
        drawProjects(cat === 'All' ? allProjects : allProjects.filter(p => p.category === cat));
      });
    }

    drawProjects(projects);
  }

  function drawProjects(projects) {
    const grid = $('#projects-grid');
    if (!grid) return;

    grid.innerHTML = projects.map(p => `
      <div class="project-card reveal in-view">
        ${p.image_url ? `<div class="project-img-wrapper" style="width:100%;height:160px;overflow:hidden;border-radius:var(--radius-sm);margin-bottom:1rem;"><img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.title)}" style="width:100%;height:100%;object-fit:cover;" /></div>` : ''}
        <div class="project-head">
          <span class="project-cat">${escapeHtml(p.category || '')}</span>
          <span class="project-status">${escapeHtml(p.status || 'completed')}</span>
        </div>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.description)}</p>
        ${p.impact ? `<div class="project-impact">${escapeHtml(p.impact)}</div>` : ''}
        <div class="tag-row">${(p.technologies || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
        ${(p.github_url || p.demo_url) ? `
        <div class="project-links" style="display:flex;gap:0.6rem;margin-top:1.25rem;flex-wrap:wrap;">
          ${p.github_url ? `<a href="${escapeHtml(p.github_url)}" target="_blank" rel="noopener" class="btn btn-secondary" style="padding:0.4rem 0.9rem;font-size:0.8rem;">🐙 GitHub</a>` : ''}
          ${p.demo_url ? `<a href="${escapeHtml(p.demo_url)}" target="_blank" rel="noopener" class="btn btn-primary" style="padding:0.4rem 0.9rem;font-size:0.8rem;">🚀 Live Demo</a>` : ''}
        </div>` : ''}
      </div>
    `).join('') || '<p>No projects yet.</p>';
  }

  function renderSkills(skills) {
    const grid = $('#skills-grid');
    if (!grid) return;
    const categories = Object.keys(skills);
    grid.innerHTML = categories.map(cat => `
      <div class="skill-cat reveal">
        <h3>${escapeHtml(cat)}</h3>
        ${skills[cat].map(s => `
          <div class="skill-row">
            <div class="skill-row-head">
              <span>${escapeHtml(s.icon || '⚡')} ${escapeHtml(s.name)}</span>
              <span class="level">${escapeHtml(s.level || '')} (${s.proficiency || 80}%)</span>
            </div>
            <div class="skill-bar">
              <div class="skill-bar-fill" data-target="${s.proficiency || 80}" style="width: 0%;"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `).join('') || '<p>No skills uploaded.</p>';

    setTimeout(() => {
      $$('.skill-bar-fill', grid).forEach(bar => {
        bar.style.width = bar.dataset.target + '%';
      });
    }, 50);
  }

  function renderEducation(items) {
    const el = $('#education-timeline');
    if (!el) return;
    el.innerHTML = items.map(e => `
      <div class="timeline-item reveal">
        <div class="timeline-dot">🎓</div>
        <div class="timeline-year">${escapeHtml(e.year_range)}</div>
        <div class="timeline-title">${escapeHtml(e.degree)}</div>
        <div class="timeline-sub">${escapeHtml(e.institution)}</div>
        <p style="white-space:pre-wrap;margin-top:0.5rem;line-height:1.65;font-size:0.92rem;">${escapeHtml(e.description || '')}</p>
      </div>
    `).join('') || '<p>No education details added yet.</p>';
  }

  function renderCertifications(items) {
    const grid = $('#cert-grid');
    if (!grid) return;
    grid.innerHTML = items.map(c => `
      <div class="cert-card reveal" style="display:flex; gap:1.25rem; background:var(--bg-card); border:1px solid var(--border); padding:1.25rem; border-radius:var(--radius); transition:transform var(--transition), border-color var(--transition);">
        <span class="cert-badge" style="font-size:2rem; background:var(--accent-soft); width:54px; height:54px; display:flex; align-items:center; justify-content:center; border-radius:var(--radius-sm); border:1px solid var(--border); flex-shrink:0;">🏆</span>
        <div>
          <div class="cert-year" style="font-size:0.78rem; font-weight:700; color:var(--accent); text-transform:uppercase; margin-bottom:0.15rem;">${escapeHtml(c.year || '')}</div>
          <strong style="font-size:1.02rem; display:block; color:var(--text);">${escapeHtml(c.title)}</strong>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-top:0.15rem;">${escapeHtml(c.issuer)}</p>
          ${c.credential_url ? `<a href="${escapeHtml(c.credential_url)}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm" style="margin-top:0.6rem; padding:0.35rem 0.75rem; font-size:0.75rem;">View Credential ↗</a>` : ''}
        </div>
      </div>
    `).join('') || '<p>No certifications added yet.</p>';
  }

  function renderTestimonials(items) {
    const grid = $('#testimonial-grid');
    if (!grid) return;
    grid.innerHTML = items.map(t => `
      <div class="testimonial-card reveal">
        <div class="testimonial-quote">"${escapeHtml(t.quote)}"</div>
        <div class="testimonial-author">
          <div class="avatar-circle">${escapeHtml(t.avatar_initial || '?')}</div>
          <div>
            <strong style="color:var(--text);font-size:0.95rem;display:block;">${escapeHtml(t.author_name)}</strong>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-top:0.1rem;">${escapeHtml(t.author_title || '')}</div>
          </div>
        </div>
      </div>
    `).join('') || '<p>No endorsements added yet.</p>';
  }

  function renderWorkExperience(items) {
    const timeline = $('#work-timeline');
    if (!timeline) return;
    timeline.innerHTML = items.map(e => `
      <div class="timeline-item reveal">
        <div class="timeline-dot">💼</div>
        <div class="timeline-year">${escapeHtml(e.start_date)} – ${escapeHtml(e.end_date)}</div>
        <div class="timeline-title">${escapeHtml(e.role)}</div>
        <div class="timeline-sub">${escapeHtml(e.company)} ${e.location ? `• ${escapeHtml(e.location)}` : ''}</div>
        <p style="white-space:pre-wrap;margin-top:0.5rem;line-height:1.65;font-size:0.92rem;">${escapeHtml(e.description)}</p>
        <div class="tag-row" style="margin-top:0.75rem;">
          ${(e.technologies || []).map(t => `<span class="tag" style="background:var(--accent-soft);color:var(--accent);">${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>
    `).join('') || '<p>No work experience added.</p>';
  }

  function renderBlog(posts) {
    const grid = $('#blog-grid');
    if (!grid) return;
    grid.innerHTML = posts.map(p => `
      <div class="project-card reveal" style="cursor:pointer;" data-slug="${escapeHtml(p.slug)}">
        <div class="project-head">
          <span>${(p.tags || []).slice(0,2).map(escapeHtml).join(', ')}</span>
          <span style="font-size:0.78rem;">${new Date(p.created_at || '').toLocaleDateString('en-IN', {month:'short',year:'numeric'})}</span>
        </div>
        <h3 style="margin-top:0.5rem;">${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.summary || '')}</p>
        <div style="margin-top:1.25rem;"><span class="text-link" style="font-size:0.85rem;font-weight:700;">Read Article →</span></div>
      </div>
    `).join('') || '<p>No blog posts published yet.</p>';

    // bind clicks
    $$('.project-card[data-slug]', grid).forEach(card => {
      card.addEventListener('click', async () => {
        const slug = card.dataset.slug;
        const post = await safeFetch(`/blog/${slug}`, null);
        if (!post) { toast('Failed to load article.', 'error'); return; }
        showBlogModal(post);
      });
    });
  }

  function showBlogModal(post) {
    let overlay = document.getElementById('blog-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'blog-overlay';
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="admin-modal-card reveal visible" style="max-width:760px;width:94vw;max-height:85vh;overflow-y:auto;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-lg);padding:2.5rem;box-shadow:var(--shadow);">
          <button id="blog-modal-close" class="modal-close-btn" style="position:absolute;top:1rem;right:1.2rem;background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1.5rem;">✕</button>
          <div class="project-head"><span id="blog-modal-tags"></span><span id="blog-modal-date" style="font-size:0.8rem;"></span></div>
          <h2 id="blog-modal-title" style="margin-top:0.75rem;font-size:1.8rem;line-height:1.25;"></h2>
          <div id="blog-modal-content" style="margin-top:2rem;line-height:1.8;color:var(--text);font-size:1rem;white-space:pre-wrap;"></div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#blog-modal-close').addEventListener('click', () => overlay.style.display = 'none');
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none'; });
    }
    overlay.querySelector('#blog-modal-tags').textContent = (post.tags || []).join(', ');
    overlay.querySelector('#blog-modal-date').textContent = new Date(post.created_at || '').toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'});
    overlay.querySelector('#blog-modal-title').textContent = post.title;
    overlay.querySelector('#blog-modal-content').innerHTML = post.content;
    overlay.style.display = 'flex';
  }

  // Brand SVG Logos
  const LOGOS = {
    email: `<svg class="logo-svg brand-email" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    phone: `<svg class="logo-svg brand-phone" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    location: `<svg class="logo-svg brand-location" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    github: `<svg class="logo-svg brand-github" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`,
    linkedin: `<svg class="logo-svg brand-linkedin" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`,
    leetcode: `<svg class="logo-svg brand-leetcode" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.19c-.652-.64-1.01-1.492-1.01-2.4a3.483 3.483 0 0 1 1.023-2.45l3.824-3.796c.545-.54.545-1.42 0-1.96a1.381 1.381 0 0 0-1.961 0L3.06 10.607a5.52 5.52 0 0 0-1.26 1.803 5.344 5.344 0 0 0-.399 2.012 5.517 5.517 0 0 0 .614 2.531 5.736 5.736 0 0 0 1.571 1.964l4.276 4.19c3.058 2.946 7.852 2.946 10.91 0l2.396-2.392c.545-.54.545-1.42 0-1.96a1.381 1.381 0 0 0-1.96 0l-2.397 2.392c-.93.912-2.39.912-3.32 0l-4.277-4.19a1.383 1.383 0 0 1 0-1.955l5.51-5.46a1.38 1.38 0 0 1 1.951 0l3.89 3.89a1.383 1.383 0 0 0 1.955 0l2.39-2.39a1.381 1.381 0 0 0 0-1.96l-3.89-3.89a3.03 3.03 0 0 1 0-4.205l3.89-3.89c.545-.54.545-1.42 0-1.96a1.381 1.381 0 0 0-1.96 0l-3.89 3.89a1.383 1.383 0 0 1-1.955 0l-3.89-3.89a1.38 1.38 0 0 0-1.951 0l-2.39 2.39c-.54.54-.54 1.414 0 1.956l3.89 3.89a3.03 3.03 0 0 1 0 4.205l-3.89 3.89c-.545.54-.545 1.42 0 1.96.27.27.624.405.98.405s.71-.135.98-.405l3.89-3.89a1.383 1.383 0 0 1 1.955 0l3.89 3.89a1.38 1.38 0 0 0 1.951 0l2.39-2.39c.54-.54.54-1.414 0-1.956l-3.89-3.89a3.03 3.03 0 0 1 0-4.205l3.89-3.89c.545-.54.545-1.42 0-1.96a1.381 1.381 0 0 0-1.96 0l-3.89 3.89a1.383 1.383 0 0 1-1.955 0l3.89 3.89a1.38 1.38 0 0 0 1.951 0l2.39-2.39c.54-.54.54-1.414 0-1.956l-3.89-3.89a3.03 3.03 0 0 1 0-4.205l3.89-3.89c.545-.54.545-1.42 0-1.96a1.381 1.381 0 0 0-1.96 0l-3.89 3.89a1.383 1.383 0 0 1-1.955 0L14.444.438A1.378 1.378 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/></svg>`,
    whatsapp: `<svg class="logo-svg brand-whatsapp" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.733-1.464L0 24zm6.59-4.846c1.6.95 3.6 1.468 5.375 1.469 5.367 0 9.73-4.359 9.733-9.719a9.695 9.695 0 0 0-2.83-6.879A9.683 9.683 0 0 0 12.008 1.83C6.643 1.83 2.279 6.19 2.276 11.55c-.001 1.897.5 3.743 1.448 5.352l-.951 3.473 3.56-.933h.001zM17.65 14.39c-.3-.15-1.79-.88-2.07-.98-.28-.1-.49-.15-.69.15-.2.3-.78.98-.96 1.18-.18.2-.36.23-.66.08-1.35-.67-2.22-1.18-3.02-2.56-.2-.35-.02-.54.16-.72l.45-.53c.18-.21.24-.36.36-.6.12-.24.06-.45-.03-.6-.09-.15-.69-1.66-.94-2.27-.25-.6-.53-.52-.69-.53-.16-.01-.35-.01-.54-.01-.19 0-.51.07-.77.36-.26.27-1 .98-1 2.4 0 1.41 1.03 2.78 1.17 2.97.14.19 2.03 3.1 4.92 4.35.69.3 1.22.48 1.64.61.69.22 1.32.19 1.82.11.56-.08 1.79-.73 2.04-1.43.25-.7.25-1.29.17-1.43-.07-.13-.27-.21-.57-.36z"/></svg>`,
    instagram: `<svg class="logo-svg brand-instagram" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>`,
    telegram: `<svg class="logo-svg brand-telegram" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 .069C5.405.069 0 5.474 0 12.069c0 6.594 5.405 12 12 12s12-5.406 12-12c0-6.595-5.405-12-12-12zm5.72 8.43l-1.92 9.07c-.14.65-.53.81-1.07.51l-2.93-2.16-1.41 1.36c-.16.16-.29.29-.6.29l.21-2.99 5.44-4.92c.24-.21-.05-.33-.37-.12l-6.73 4.24-2.9-.91c-.63-.2-1.03-.63-.06-.99l11.35-4.38c.52-.19 1 .13.78.93z"/></svg>`,
    facebook: `<svg class="logo-svg brand-facebook" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
    kaggle: `<svg class="logo-svg brand-kaggle" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18.82 24l-7.46-10.74L18.82 0h-3.79l-7.32 10.72V0H4.37v24h3.34v-8.24L15.03 24h3.79z"/></svg>`
  };

  // Global references for contact card/info dynamic populating
  let profileData = null;
  let settingsData = null;

  function updateIdCard(p, s) {
    if (!p || !s) return;
    
    const labelEl = $('#hero-card-label');
    if (labelEl) labelEl.textContent = s.flashcard_label || 'SYSTEM ACCESS BADGE';
    
    const emailRow = $('#id-card-email-row');
    if (emailRow) {
      emailRow.style.display = (p.email && s.show_email !== false && s.flashcard_show_email !== false) ? 'flex' : 'none';
      const icon = $('.icon', emailRow);
      if (icon) icon.innerHTML = LOGOS.email;
    }
    
    const phoneRow = $('#id-card-phone-row');
    if (phoneRow) {
      phoneRow.style.display = (p.phone && s.show_phone !== false && s.flashcard_show_phone !== false) ? 'flex' : 'none';
      const icon = $('.icon', phoneRow);
      if (icon) icon.innerHTML = LOGOS.phone;
    }
    
    const locationRow = $('#id-card-location-row');
    if (locationRow) {
      locationRow.style.display = p.location ? 'flex' : 'none';
      const icon = $('.icon', locationRow);
      if (icon) icon.innerHTML = LOGOS.location;
    }
    
    const socialsRow = $('#id-card-socials-row');
    if (socialsRow) {
      let html = '';
      if (p.github_url && s.show_github !== false) {
        html += `<a href="${escapeHtml(p.github_url)}" target="_blank" rel="noopener" title="GitHub" class="id-social-btn github">${LOGOS.github}</a>`;
      }
      if (p.linkedin_url && s.show_linkedin !== false) {
        html += `<a href="${escapeHtml(p.linkedin_url)}" target="_blank" rel="noopener" title="LinkedIn" class="id-social-btn linkedin">${LOGOS.linkedin}</a>`;
      }
      if (p.leetcode_url && s.show_leetcode !== false) {
        html += `<a href="${escapeHtml(p.leetcode_url)}" target="_blank" rel="noopener" title="LeetCode" class="id-social-btn leetcode">${LOGOS.leetcode}</a>`;
      }
      if (p.whatsapp_url && s.show_whatsapp !== false) {
        html += `<a href="${escapeHtml(p.whatsapp_url)}" target="_blank" rel="noopener" title="WhatsApp" class="id-social-btn whatsapp">${LOGOS.whatsapp}</a>`;
      }
      if (p.instagram_url && s.show_instagram !== false) {
        html += `<a href="${escapeHtml(p.instagram_url)}" target="_blank" rel="noopener" title="Instagram" class="id-social-btn instagram">${LOGOS.instagram}</a>`;
      }
      if (p.telegram_url && s.show_telegram !== false) {
        html += `<a href="${escapeHtml(p.telegram_url)}" target="_blank" rel="noopener" title="Telegram" class="id-social-btn telegram">${LOGOS.telegram}</a>`;
      }
      if (p.facebook_url && s.show_facebook !== false) {
        html += `<a href="${escapeHtml(p.facebook_url)}" target="_blank" rel="noopener" title="Facebook" class="id-social-btn facebook">${LOGOS.facebook}</a>`;
      }
      if (p.kaggle_url && s.show_kaggle !== false) {
        html += `<a href="${escapeHtml(p.kaggle_url)}" target="_blank" rel="noopener" title="Kaggle" class="id-social-btn kaggle">${LOGOS.kaggle}</a>`;
      }
      socialsRow.innerHTML = html;
    }
  }

  function initIdCardTilt() {
    const wrapper = $('.id-card-wrapper');
    const card = $('.id-card');
    if (!wrapper || !card) return;

    wrapper.addEventListener('mousemove', (e) => {
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const xc = rect.width / 2;
      const yc = rect.height / 2;
      
      const angleX = (yc - y) / 95;
      const angleY = (x - xc) / 95;
      
      card.style.transform = `perspective(1200px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale(1.005)`;
      
      const percentageX = (x / rect.width) * 100;
      const percentageY = (y / rect.height) * 100;
      
      const holograms = $$('.id-card-hologram');
      holograms.forEach(holo => {
        holo.style.background = `radial-gradient(circle at ${percentageX}% ${percentageY}%, rgba(0, 255, 159, 0.12) 0%, rgba(139, 92, 246, 0.06) 35%, transparent 75%)`;
      });
      
      const shines = $$('.id-card-shine');
      shines.forEach(sh => {
        sh.style.background = `radial-gradient(circle at ${percentageX}% ${percentageY}%, rgba(255, 255, 255, 0.16) 0%, transparent 60%)`;
      });
    });

    wrapper.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)';
      
      const holograms = $$('.id-card-hologram');
      holograms.forEach(holo => {
        holo.style.background = 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 60%, rgba(255,255,255,0) 100%)';
      });
      
      const shines = $$('.id-card-shine');
      shines.forEach(sh => {
        sh.style.background = 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0) 100%)';
      });
    });
  }

  function renderContactInfo(p, s) {
    const list = $('#contact-info-list');
    if (!list) return;
    
    let primaryHtml = '<div class="contact-details-clean">';
    if (p.email && s.show_email !== false) {
      primaryHtml += `<div class="contact-clean-item email"><span class="icon">${LOGOS.email}</span><div class="info"><strong>Email</strong><a href="mailto:${escapeHtml(p.email)}">${escapeHtml(p.email)}</a></div></div>`;
    }
    if (p.phone && s.show_phone !== false) {
      primaryHtml += `<div class="contact-clean-item phone"><span class="icon">${LOGOS.phone}</span><div class="info"><strong>Phone</strong><a href="tel:${escapeHtml(p.phone)}">${escapeHtml(p.phone)}</a></div></div>`;
    }
    if (p.location) {
      primaryHtml += `<div class="contact-clean-item location"><span class="icon">${LOGOS.location}</span><div class="info"><strong>Location</strong><span>${escapeHtml(p.location)}</span></div></div>`;
    }
    primaryHtml += '</div>';

    let socialsHtml = '<div class="contact-socials-row">';
    if (p.github_url && s.show_github !== false) {
      socialsHtml += `<a href="${escapeHtml(p.github_url)}" target="_blank" rel="noopener" title="GitHub" class="contact-social-badge github">${LOGOS.github}</a>`;
    }
    if (p.linkedin_url && s.show_linkedin !== false) {
      socialsHtml += `<a href="${escapeHtml(p.linkedin_url)}" target="_blank" rel="noopener" title="LinkedIn" class="contact-social-badge linkedin">${LOGOS.linkedin}</a>`;
    }
    if (p.leetcode_url && s.show_leetcode !== false) {
      socialsHtml += `<a href="${escapeHtml(p.leetcode_url)}" target="_blank" rel="noopener" title="LeetCode" class="contact-social-badge leetcode">${LOGOS.leetcode}</a>`;
    }
    if (p.whatsapp_url && s.show_whatsapp !== false) {
      socialsHtml += `<a href="${escapeHtml(p.whatsapp_url)}" target="_blank" rel="noopener" title="WhatsApp" class="contact-social-badge whatsapp">${LOGOS.whatsapp}</a>`;
    }
    if (p.instagram_url && s.show_instagram !== false) {
      socialsHtml += `<a href="${escapeHtml(p.instagram_url)}" target="_blank" rel="noopener" title="Instagram" class="contact-social-badge instagram">${LOGOS.instagram}</a>`;
    }
    if (p.telegram_url && s.show_telegram !== false) {
      socialsHtml += `<a href="${escapeHtml(p.telegram_url)}" target="_blank" rel="noopener" title="Telegram" class="contact-social-badge telegram">${LOGOS.telegram}</a>`;
    }
    if (p.facebook_url && s.show_facebook !== false) {
      socialsHtml += `<a href="${escapeHtml(p.facebook_url)}" target="_blank" rel="noopener" title="Facebook" class="contact-social-badge facebook">${LOGOS.facebook}</a>`;
    }
    if (p.kaggle_url && s.show_kaggle !== false) {
      socialsHtml += `<a href="${escapeHtml(p.kaggle_url)}" target="_blank" rel="noopener" title="Kaggle" class="contact-social-badge kaggle">${LOGOS.kaggle}</a>`;
    }
    socialsHtml += '</div>';

    list.innerHTML = primaryHtml + socialsHtml;
  }

  function renderFooterSocials(p, s) {
    const list = $('#footer-socials-list');
    if (!list) return;

    let html = '';
    if (p.email && s.show_email !== false) {
      html += `<a href="mailto:${escapeHtml(p.email)}" title="Email" class="footer-social-badge email">${LOGOS.email}</a>`;
    }
    if (p.linkedin_url && s.show_linkedin !== false) {
      html += `<a href="${escapeHtml(p.linkedin_url)}" target="_blank" rel="noopener" title="LinkedIn" class="footer-social-badge linkedin">${LOGOS.linkedin}</a>`;
    }
    if (p.github_url && s.show_github !== false) {
      html += `<a href="${escapeHtml(p.github_url)}" target="_blank" rel="noopener" title="GitHub" class="footer-social-badge github">${LOGOS.github}</a>`;
    }
    if (p.leetcode_url && s.show_leetcode !== false) {
      html += `<a href="${escapeHtml(p.leetcode_url)}" target="_blank" rel="noopener" title="LeetCode" class="footer-social-badge leetcode">${LOGOS.leetcode}</a>`;
    }
    if (p.whatsapp_url && s.show_whatsapp !== false) {
      html += `<a href="${escapeHtml(p.whatsapp_url)}" target="_blank" rel="noopener" title="WhatsApp" class="footer-social-badge whatsapp">${LOGOS.whatsapp}</a>`;
    }
    if (p.instagram_url && s.show_instagram !== false) {
      html += `<a href="${escapeHtml(p.instagram_url)}" target="_blank" rel="noopener" title="Instagram" class="footer-social-badge instagram">${LOGOS.instagram}</a>`;
    }
    if (p.telegram_url && s.show_telegram !== false) {
      html += `<a href="${escapeHtml(p.telegram_url)}" target="_blank" rel="noopener" title="Telegram" class="footer-social-badge telegram">${LOGOS.telegram}</a>`;
    }
    if (p.facebook_url && s.show_facebook !== false) {
      html += `<a href="${escapeHtml(p.facebook_url)}" target="_blank" rel="noopener" title="Facebook" class="footer-social-badge facebook">${LOGOS.facebook}</a>`;
    }
    if (p.kaggle_url && s.show_kaggle !== false) {
      html += `<a href="${escapeHtml(p.kaggle_url)}" target="_blank" rel="noopener" title="Kaggle" class="footer-social-badge kaggle">${LOGOS.kaggle}</a>`;
    }

    list.innerHTML = html;
  }

  function applyProfile(p) {
    if (!p) return;
    
    profileData = p;
    if (settingsData) {
      renderContactInfo(profileData, settingsData);
      updateIdCard(profileData, settingsData);
      renderFooterSocials(profileData, settingsData);
    }
    
    const brand = $('.nav-brand');
    if (brand && p.full_name) {
      const parts = p.full_name.split(' ');
      if (parts.length > 1) {
        brand.innerHTML = `<span>${escapeHtml(parts[0])}</span><span class="accent">${escapeHtml(parts.slice(1).join(' '))}</span>`;
      } else {
        brand.innerHTML = `<span class="accent">${escapeHtml(p.full_name)}</span>`;
      }
    }

    document.title = `${escapeHtml(p.full_name)} — ${escapeHtml(p.job_title)}`;
    const metaDesc = $('meta[name="description"]');
    if (metaDesc && p.bio) {
      metaDesc.setAttribute('content', `${escapeHtml(p.full_name)} — ${escapeHtml(p.job_title)}. ${escapeHtml(p.tagline || '')}`);
    }

    const heroTagline = $('#hero-tagline');
    if (heroTagline && p.tagline) {
      heroTagline.textContent = escapeHtml(p.tagline);
    }
    const heroSubtitle = $('.hero .subtitle');
    if (heroSubtitle && p.bio) {
      heroSubtitle.textContent = p.bio;
    }
    const availabilityBadge = $('.hero .status-badge');
    if (availabilityBadge && p.availability_status) {
      availabilityBadge.innerHTML = `<span class="dot"></span> ${escapeHtml(p.availability_status)}`;
    }
    const heroCardLabel = $('#hero-card-label');
    if (heroCardLabel && p.flashcard_label) {
      heroCardLabel.textContent = p.flashcard_label;
    }
    const heroCardName = $('#hero-card-name');
    if (heroCardName && p.full_name) heroCardName.textContent = p.full_name;
    const heroCardTitle = $('#hero-card-title');
    if (heroCardTitle && p.job_title) heroCardTitle.textContent = p.job_title;
    const heroCardCopy = $('#hero-card-copy');
    if (heroCardCopy && p.availability_status) heroCardCopy.textContent = p.availability_status;
    const heroCardLocation = $('#hero-card-location');
    if (heroCardLocation && p.location) heroCardLocation.textContent = p.location;
    const heroCardEmail = $('#hero-card-email');
    if (heroCardEmail && p.email) heroCardEmail.textContent = p.email;
    const heroCardPhone = $('#hero-card-phone');
    if (heroCardPhone && p.phone) heroCardPhone.textContent = p.phone;

    if (p.linkedin_url) {
      $$('a[href*="linkedin.com"]').forEach(a => a.href = p.linkedin_url);
    }
    if (p.github_url) {
      $$('a[href*="github.com"]').forEach(a => a.href = p.github_url);
    }
    if (p.leetcode_url) {
      $$('a[href*="leetcode.com"]').forEach(a => a.href = p.leetcode_url);
    }
  }

  // -----------------------------------------------------------------
  // Contact form
  // -----------------------------------------------------------------
  function initContactForm() {
    const form = $('#contact-form');
    const submitBtn = $('#contact-submit');
    const msgTextarea = $('#message');
    const charCounter = $('#message-counter');

    if (msgTextarea && charCounter) {
      msgTextarea.addEventListener('input', () => {
        const len = msgTextarea.value.length;
        const max = 5000;
        charCounter.textContent = `${len} / ${max}`;
        charCounter.className = 'char-counter' + (len > 4500 ? ' limit' : len > 4000 ? ' warn' : '');
      });
    }

    function setFieldError(id, message) {
      const errEl = $(`#${id}-error`);
      if (message) {
        errEl.textContent = message;
        errEl.style.display = 'block';
      } else {
        errEl.style.display = 'none';
      }
    }

    function validate(data) {
      let ok = true;
      if (!data.name || data.name.trim().length < 2) { setFieldError('name', 'Please enter your name.'); ok = false; } else setFieldError('name', '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || '')) { setFieldError('email', 'Please enter a valid email.'); ok = false; } else setFieldError('email', '');
      if (!data.message || data.message.trim().length < 5) { setFieldError('message', 'Message is too short.'); ok = false; } else setFieldError('message', '');
      return ok;
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
          name: $('#name').value,
          email: $('#email').value,
          message: $('#message').value,
        };
        if (!validate(data)) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';

        try {
          const res = await fetch(API + '/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const result = await res.json();
          if (res.ok) {
            toast("Message sent — thank you! I'll get back to you soon.", 'success');
            form.reset();
            if (charCounter) { charCounter.textContent = '0 / 5000'; charCounter.className = 'char-counter'; }
          } else {
            toast(result.error || 'Something went wrong. Please try again.', 'error');
          }
        } catch (err) {
          toast('Network error — please try again or email directly.', 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Message';
        }
      });
    }
  }

  // -----------------------------------------------------------------
  // Lightweight page-view analytics
  // -----------------------------------------------------------------
  function trackPageView() {
    fetch(API + '/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'page_view', page: window.location.pathname }),
    }).catch(() => {});
  }

  // -----------------------------------------------------------------
  // Site settings (public)
  // -----------------------------------------------------------------
  async function applySiteSettings() {
    try {
      const res = await fetch('/api/site/settings');
      if (!res.ok) return;
      const s = await res.json();
      
      settingsData = s;
      if (profileData) {
        renderContactInfo(profileData, settingsData);
        updateIdCard(profileData, settingsData);
        renderFooterSocials(profileData, settingsData);
      }

      if (!s.show_header) { const nav = document.querySelector('nav'); if (nav) nav.style.display = 'none'; }
      if (!s.show_footer) { const f = document.querySelector('footer'); if (f) f.style.display = 'none'; }
      
      // Dynamic visibility of sections, navigation, and drawer links
      const sections = ['about', 'projects', 'skills', 'experience', 'education', 'certifications', 'testimonials', 'blog', 'contact'];
      sections.forEach(k => {
        const el = document.getElementById(k === 'experience' ? 'work' : k);
        const navEl = document.getElementById(`nav-${k}`);
        const drawerEl = document.getElementById(`drawer-${k}`);
        const visible = s[`show_${k}`] !== false;
        
        if (el) el.style.display = visible ? 'block' : 'none';
        if (navEl) navEl.style.display = visible ? 'block' : 'none';
        if (drawerEl) drawerEl.style.display = visible ? 'block' : 'none';
      });
      
      if (s.owner_image) {
        const img = document.getElementById('owner-image');
        if (img) img.src = s.owner_image;
      }
      if (typeof s.flashcard_label === 'string') {
        const labelEl = document.getElementById('hero-card-label');
        if (labelEl) labelEl.textContent = s.flashcard_label;
      }
      if (typeof s.flashcard_show_email !== 'undefined') {
        const emailRow = document.getElementById('hero-card-email')?.parentElement;
        if (emailRow) emailRow.style.display = s.flashcard_show_email ? 'flex' : 'none';
      }
      if (typeof s.flashcard_show_phone !== 'undefined') {
        const phoneRow = document.getElementById('hero-card-phone')?.parentElement;
        if (phoneRow) phoneRow.style.display = s.flashcard_show_phone ? 'flex' : 'none';
      }

      // Palette theme management
      if (s.theme_palette) {
        currentPalette = s.theme_palette;
        document.documentElement.setAttribute('data-theme', `${currentPalette}-${currentMode}`);
      }
    } catch (e) { /* ignore */ }
  }

  // Count-up animation for hero stats
  function initCountUp() {
    const statEls = $$('.stat-value[data-target]');
    if (!statEls.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.dataset.target);
        const suffix = el.dataset.suffix || '';
        const decimals = parseInt(el.dataset.decimals || '0');
        const duration = 1600;
        const start = performance.now();

        function step(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = eased * target;
          el.textContent = current.toFixed(decimals) + suffix;
          if (progress < 1) requestAnimationFrame(step);
          else el.textContent = target.toFixed(decimals) + suffix;
        }
        requestAnimationFrame(step);
        observer.unobserve(el);
      });
    }, { threshold: 0.5 });

    statEls.forEach(el => observer.observe(el));
  }

  // Admin Login Modal
  function initAdminLogin() {
    const overlay = document.getElementById('admin-login-overlay');
    const closeBtn = document.getElementById('admin-modal-close');
    const portalLink = document.getElementById('admin-portal-link');
    const form = document.getElementById('admin-login-form');
    const pwInput = document.getElementById('admin-password');
    const errorEl = document.getElementById('admin-login-error');
    const loginBtn = document.getElementById('admin-login-btn');

    if (!overlay || !portalLink) return;

    if (new URLSearchParams(window.location.search).get('admin') === 'login') {
      overlay.style.display = 'flex';
      setTimeout(() => pwInput && pwInput.focus(), 100);
    }

    const openModal = (e) => {
      if (e) e.preventDefault();
      overlay.style.display = 'flex';
      setTimeout(() => pwInput && pwInput.focus(), 100);
    };

    const closeModal = () => {
      overlay.style.display = 'none';
      if (errorEl) { errorEl.textContent = ''; errorEl.style.display = 'none'; }
      if (pwInput) pwInput.value = '';
    };

    portalLink.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.style.display !== 'none') closeModal(); });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = pwInput.value.trim();
      if (!password) return;

      loginBtn.disabled = true;
      loginBtn.textContent = 'Logging in…';
      errorEl.style.display = 'none';

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        const data = await res.json();

        if (res.ok && data.success) {
          sessionStorage.setItem('admin_key', data.key);
          localStorage.setItem('admin_key', data.key);
          loginBtn.textContent = '✅ Redirecting…';
          setTimeout(() => { window.location.href = '/admin'; }, 400);
        } else {
          errorEl.textContent = data.error || 'Invalid credentials';
          errorEl.style.display = 'block';
          const card = document.querySelector('.admin-modal-card');
          if (card) {
            card.classList.remove('shake');
            void card.offsetWidth;
            card.classList.add('shake');
          }
          loginBtn.disabled = false;
          loginBtn.textContent = 'Login to Dashboard';
          pwInput.value = '';
          pwInput.focus();
        }
      } catch (err) {
        errorEl.textContent = 'Network error — please try again.';
        errorEl.style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login to Dashboard';
      }
    });
  }

  // -----------------------------------------------------------------
  // Interactive Particle Starfield Background
  // -----------------------------------------------------------------
  function initStarfield() {
    const canvas = document.getElementById('starfield-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let stars = [];
    const count = 120;
    let width = window.innerWidth;
    let height = window.innerHeight;

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    canvas.width = width;
    canvas.height = height;

    class Star {
      constructor() {
        this.reset();
        this.z = Math.random() * width;
      }

      reset() {
        this.x = (Math.random() - 0.5) * width * 2;
        this.y = (Math.random() - 0.5) * height * 2;
        this.z = width;
        this.size = Math.random() * 1.5 + 0.5;
        this.speed = Math.random() * 0.8 + 0.2;
        
        const colors = [
          'rgba(0, 206, 168, 0.45)', // Neon teal
          'rgba(191, 97, 255, 0.45)', // Neon purple
          'rgba(245, 175, 25, 0.35)', // Sunset gold
          'rgba(255, 255, 255, 0.7)'  // Clean white
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.z -= this.speed;
        if (this.z <= 0) {
          this.reset();
        }
      }

      draw() {
        const px = (this.x / this.z) * width + width / 2;
        const py = (this.y / this.z) * height + height / 2;

        const mouseOffsetDist = 12;
        const dx = px - (mouseX - width/2) * (width - this.z) / (width * mouseOffsetDist);
        const dy = py - (mouseY - height/2) * (height - this.z) / (height * mouseOffsetDist);

        if (dx < 0 || dx > width || dy < 0 || dy > height) {
          return;
        }

        const size = Math.max(0, (1 - this.z / width) * this.size * 3);
        ctx.beginPath();
        ctx.arc(dx, dy, size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        
        if (size > 2) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = this.color;
        } else {
          ctx.shadowBlur = 0;
        }
        
        ctx.fill();
      }
    }

    for (let i = 0; i < count; i++) {
      stars.push(new Star());
    }

    window.addEventListener('resize', () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    });

    window.addEventListener('mousemove', (e) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    });

    function animate() {
      ctx.clearRect(0, 0, width, height);

      mouseX += (targetMouseX - mouseX) * 0.08;
      mouseY += (targetMouseY - mouseY) * 0.08;

      stars.forEach(star => {
        star.update();
        star.draw();
      });

      requestAnimationFrame(animate);
    }

    animate();
  }

  // -----------------------------------------------------------------
  // Reusable 3D Tilt & Sheen Hover Effect for Cards
  // -----------------------------------------------------------------
  function initUniversalCardTilt() {
    const cardSelectors = ['.card.glass', '.skill-cat', '.project-card'];
    
    function applyTiltToElements(elements) {
      elements.forEach(card => {
        if (card.dataset.tiltBound) return;
        card.dataset.tiltBound = 'true';
        card.classList.add('tilt-card');

        let shine = card.querySelector('.card-shine-overlay');
        if (!shine) {
          shine = document.createElement('div');
          shine.className = 'card-shine-overlay';
          card.appendChild(shine);
        }

        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          const xc = rect.width / 2;
          const yc = rect.height / 2;
          
          const maxTilt = 6;
          const angleX = -((yc - y) / yc) * maxTilt;
          const angleY = ((x - xc) / xc) * maxTilt;
          
          card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) translateY(-4px)`;
          
          const percentageX = (x / rect.width) * 100;
          const percentageY = (y / rect.height) * 100;
          shine.style.background = `radial-gradient(circle at ${percentageX}% ${percentageY}%, rgba(255, 255, 255, 0.06) 0%, transparent 70%)`;
          shine.style.opacity = '1';
        });

        card.addEventListener('mouseleave', () => {
          card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
          shine.style.opacity = '0';
        });
      });
    }

    cardSelectors.forEach(sel => {
      applyTiltToElements($$(sel));
    });

    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mut => {
        mut.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            cardSelectors.forEach(sel => {
              if (node.matches && node.matches(sel)) {
                applyTiltToElements([node]);
              }
              applyTiltToElements(Array.from(node.querySelectorAll(sel)));
            });
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // -----------------------------------------------------------------
  // Typewriter Animation (Mitchell Sparrow style)
  // -----------------------------------------------------------------
  function initTypewriter() {
    const el = document.getElementById('typewriter-text');
    if (!el) return;
    const phrases = [
      'decisions that matter',
      'predictive ML models',
      'interactive dashboards',
      'actionable insights'
    ];
    let phraseIndex = 0;
    let charIndex = phrases[0].length;
    let isDeleting = true;
    let typingSpeed = 100;

    function type() {
      const currentPhrase = phrases[phraseIndex];
      if (isDeleting) {
        el.textContent = currentPhrase.substring(0, charIndex);
        charIndex--;
        typingSpeed = 50;
      } else {
        el.textContent = currentPhrase.substring(0, charIndex);
        charIndex++;
        typingSpeed = 120;
      }

      if (!isDeleting && charIndex > currentPhrase.length) {
        isDeleting = true;
        typingSpeed = 2500;
      } else if (isDeleting && charIndex < 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        charIndex = 0;
        typingSpeed = 500;
      }

      setTimeout(type, typingSpeed);
    }

    setTimeout(type, 2000);
  }

  // DOM Loaded Init
  document.addEventListener('DOMContentLoaded', async () => {
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    initTheme();
    initMobileNav();
    initScrollEffects();
    initAdminLogin();
    initContactForm();
    initCountUp();
    trackPageView();
    await applySiteSettings();

    const [projects, skills, education, certifications, testimonials, experience, blog, profile] = await Promise.all([
      safeFetch('/projects', FALLBACK.projects),
      safeFetch('/skills', FALLBACK.skills),
      safeFetch('/education', FALLBACK.education),
      safeFetch('/certifications', FALLBACK.certifications),
      safeFetch('/testimonials', FALLBACK.testimonials),
      safeFetch('/experience', []),
      safeFetch('/blog', []),
      safeFetch('/profile', null),
    ]);

    renderProjects(projects);
    renderSkills(skills);
    renderEducation(education);
    renderCertifications(certifications);
    renderTestimonials(testimonials);
    renderWorkExperience(experience);
    renderBlog(blog);
    applyProfile(profile);

    initRevealOnScroll();
    initIdCardTilt();
    initStarfield();
    initUniversalCardTilt();
    initTypewriter();
  });

  // -----------------------------------------------------------------
  // Advanced Effects (PortX + Eric Wadkins style)
  // -----------------------------------------------------------------

  // Site Background: full-page fixed image or video
  function initHeroBg(s) {
    const wrapper = document.getElementById('hero-bg-media');
    if (!wrapper) return;

    const imgUrl = s.hero_bg_image || '';
    const vidUrl = s.hero_bg_video || '';
    const opacity = parseFloat(s.hero_bg_opacity ?? 1);
    const parallax = s.hero_bg_parallax !== false;
    const blur = parseInt(s.hero_bg_blur ?? 0);

    if (!imgUrl && !vidUrl) return;

    if (vidUrl) {
      const vid = document.createElement('video');
      vid.src = vidUrl;
      vid.autoplay = true;
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.style.opacity = opacity;
      if (blur > 0) vid.style.filter = `blur(${blur}px)`;
      wrapper.insertBefore(vid, wrapper.firstChild);
    } else if (imgUrl) {
      const img = document.createElement('img');
      img.src = imgUrl;
      img.alt = '';
      img.style.opacity = opacity;
      if (blur > 0) img.style.filter = `blur(${blur}px)`;
      wrapper.insertBefore(img, wrapper.firstChild);

      if (parallax) {
        window.addEventListener('scroll', () => {
          const scrolled = window.scrollY;
          const pageH = document.body.scrollHeight - window.innerHeight;
          const ratio = pageH > 0 ? scrolled / pageH : 0;
          // Subtle parallax shift across entire page
          img.style.transform = `translateY(${ratio * 80}px) scale(1.08)`;
        }, { passive: true });
        img.style.transform = 'scale(1.08)';
      }
    }
  }

  // Custom Magnetic Cursor with spring physics
  function initMagneticCursor(s) {
    if (s.enable_magnetic_cursor === false) return;
    if (window.matchMedia('(hover: none)').matches) return;

    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    document.body.classList.add('has-cursor');

    let dotX = 0, dotY = 0;
    let ringX = 0, ringY = 0;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    document.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    document.addEventListener('mousedown', () => {
      dot.classList.add('clicking');
      ring.classList.add('clicking');
    });
    document.addEventListener('mouseup', () => {
      dot.classList.remove('clicking');
      ring.classList.remove('clicking');
    });

    // Hover detection on interactive elements
    const hoverEls = 'a, button, [role="button"], .btn, .filter-btn, .project-card, .card, input, textarea, .id-card-flip-btn';
    document.addEventListener('mouseover', e => {
      if (e.target.closest(hoverEls)) {
        dot.classList.add('hovering');
        ring.classList.add('hovering');
      }
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(hoverEls)) {
        dot.classList.remove('hovering');
        ring.classList.remove('hovering');
      }
    });

    // Spring loop
    function animateCursor() {
      // Dot snaps fast
      dotX += (mouseX - dotX) * 0.85;
      dotY += (mouseY - dotY) * 0.85;
      // Ring follows with spring lag
      ringX += (mouseX - ringX) * 0.28;
      ringY += (mouseY - ringY) * 0.28;

      dot.style.left = dotX + 'px';
      dot.style.top = dotY + 'px';
      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';

      requestAnimationFrame(animateCursor);
    }
    animateCursor();
  }

  // Particle Trail (canvas-based mouse trail)
  function initParticleTrail(s) {
    if (s.enable_particle_trail === false) return;
    if (window.matchMedia('(hover: none)').matches) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    });

    // Get accent color from CSS variable
    function getAccentColor() {
      return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#00cea8';
    }

    const particles = [];
    let mx = -9999, my = -9999;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

    class Particle {
      constructor(x, y) {
        this.x = x + (Math.random() - 0.5) * 12;
        this.y = y + (Math.random() - 0.5) * 12;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5 - 0.5;
        this.life = 1;
        this.decay = Math.random() * 0.03 + 0.02;
        this.size = Math.random() * 3 + 1;
        this.color = getAccentColor();
      }
      update() { this.x += this.vx; this.y += this.vy; this.life -= this.decay; }
      draw() {
        ctx.save();
        ctx.globalAlpha = this.life * 0.6;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0, this.size * this.life), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    let lastSpawn = 0;
    function animateParticles(time) {
      ctx.clearRect(0, 0, W, H);
      if (time - lastSpawn > 30 && mx > 0) {
        particles.push(new Particle(mx, my));
        lastSpawn = time;
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) particles.splice(i, 1);
      }
      requestAnimationFrame(animateParticles);
    }
    requestAnimationFrame(animateParticles);
  }

  // Floating Gradient Orbs
  function initGradientOrbs(s) {
    if (s.enable_gradient_orbs === false) return;

    ['orb-1', 'orb-2', 'orb-3'].forEach((cls, i) => {
      const orb = document.createElement('div');
      orb.className = `orb ${cls}`;
      document.body.appendChild(orb);
      setTimeout(() => orb.classList.add('visible'), 100 + i * 200);
    });

    // Subtle mouse parallax on orbs
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });

    function updateOrbs() {
      const orbs = document.querySelectorAll('.orb');
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (mx - cx) / cx;
      const dy = (my - cy) / cy;
      orbs.forEach((orb, i) => {
        const factor = (i + 1) * 18;
        orb.style.transform = `translate(${dx * factor}px, ${dy * factor}px)`;
      });
      requestAnimationFrame(updateOrbs);
    }
    updateOrbs();
  }

  // Apply footer tagline from settings
  function applyFooterSettings(s) {
    const copyEl = document.getElementById('footer-copy-text');
    const yearEl = document.getElementById('year');
    const year = new Date().getFullYear();

    if (yearEl) yearEl.textContent = year;
    if (copyEl && s.footer_tagline) {
      copyEl.innerHTML = `&copy; <span id="year">${year}</span> &mdash; ${s.footer_tagline}`;
    }

    // Hide footer socials if disabled
    const footerSocials = document.getElementById('footer-socials-list');
    if (footerSocials && s.footer_show_social === false) {
      footerSocials.style.display = 'none';
    }
  }

  // Extend applySiteSettings to call advanced effect inits
  const _origApplySiteSettings = window._applySiteSettings;

  document.addEventListener('DOMContentLoaded', async () => {
    // Wait a tick for applySiteSettings to finish (it runs in the other listener)
    // We hook into the settings data by reading it again after a short delay
    setTimeout(async () => {
      try {
        const res = await fetch('/api/site/settings');
        if (!res.ok) return;
        const s = await res.json();
        initHeroBg(s);
        initMagneticCursor(s);
        initParticleTrail(s);
        initGradientOrbs(s);
        applyFooterSettings(s);
      } catch (e) {
        // effects not critical — fail silently
      }
    }, 150);
  });

})();
