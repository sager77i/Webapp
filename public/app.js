/**
 * TRENDPULSE - Talk of The Town Web Application
 * Complete Interactive Frontend Client
 */

// Global State
const state = {
  currentView: 'curated', // 'curated' | 'live' | 'polls' | 'bookmarks'
  regionFilter: 'all',    // 'all' | 'th' | 'global'
  categoryFilter: 'all',
  searchQuery: '',
  sortBy: 'buzz',
  activeHeroRegion: 'th',
  curatedNews: [],
  liveNews: [],
  trendsData: null,
  bookmarks: JSON.parse(localStorage.getItem('tp_bookmarks') || '[]'),
  currentModalItem: null,
  isSpeaking: false,
  synthUtterance: null
};

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLiveClock();
  initSearch();
  loadContent();
  loadTrends();
  updateBookmarkBadge();
});

// 1. Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem('tp_theme') || 'dark';
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.setItem('tp_theme', isDark ? 'dark' : 'light');
      showToast(`เปลี่ยนเป็นโหมด ${isDark ? 'มืด (Dark)' : 'สว่าง (Light)'}`, 'info');
    });
  }
}

// 2. Real-time Live Clock
function initLiveClock() {
  const clockEl = document.getElementById('live-clock');
  function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (clockEl) clockEl.textContent = `สด • ${timeStr} น.`;
  }
  updateTime();
  setInterval(updateTime, 1000);
}

// 3. Search Initialization
function initSearch() {
  const searchInput = document.getElementById('search-input');
  const searchInputMobile = document.getElementById('search-input-mobile');
  const clearBtn = document.getElementById('clear-search-btn');

  function handleSearch(val) {
    state.searchQuery = val.trim().toLowerCase();
    if (clearBtn) {
      if (state.searchQuery) {
        clearBtn.classList.remove('hidden');
      } else {
        clearBtn.classList.add('hidden');
      }
    }
    renderContent();
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      if (searchInputMobile) searchInputMobile.value = e.target.value;
      handleSearch(e.target.value);
    });
  }

  if (searchInputMobile) {
    searchInputMobile.addEventListener('input', (e) => {
      if (searchInput) searchInput.value = e.target.value;
      handleSearch(e.target.value);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (searchInputMobile) searchInputMobile.value = '';
      handleSearch('');
    });
  }
}

// 4. Data Fetching
async function loadContent(showToastNotice = false) {
  showLoading(true);
  try {
    // 1. Fetch Curated news with latest reactions and polls
    const curatedRes = await fetch('/api/news');
    const curatedData = await curatedRes.json();
    if (curatedData.status === 'success') {
      state.curatedNews = curatedData.data;
    }

    // 2. Fetch Live RSS feeds (both TH and Global)
    const [thRssRes, globalRssRes] = await Promise.all([
      fetch('/api/live-rss?region=th').catch(() => null),
      fetch('/api/live-rss?region=global').catch(() => null)
    ]);

    let liveItems = [];
    if (thRssRes && thRssRes.ok) {
      const thData = await thRssRes.json();
      if (thData.data) liveItems = liveItems.concat(thData.data);
    }
    if (globalRssRes && globalRssRes.ok) {
      const globalData = await globalRssRes.json();
      if (globalData.data) liveItems = liveItems.concat(globalData.data);
    }
    state.liveNews = liveItems;

    renderContent();

    if (showToastNotice) {
      showToast('อัปเดตข้อมูลข่าวสาร Talk of The Town เรียบร้อย!', 'success');
    }
  } catch (err) {
    console.error('Error loading content:', err);
    showToast('เกิดข้อผิดพลาดในการโหลดข้อมูลข่าวสาร', 'error');
  } finally {
    showLoading(false);
  }
}

// 5. Fetch Trends & Hashtags
async function loadTrends() {
  try {
    const res = await fetch('/api/trends');
    const json = await res.json();
    if (json.status === 'success') {
      state.trendsData = json.data;
      renderHashtags(json.data.topHashtags);
    }
  } catch (err) {
    console.error('Trends error:', err);
  }
}

function renderHashtags(tags) {
  const container = document.getElementById('hashtag-bar');
  if (!container || !tags) return;

  container.innerHTML = tags.map(item => `
    <button onclick="filterByTag('${item.tag}')" class="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-rose-500 dark:hover:border-rose-500 font-semibold text-gray-700 dark:text-gray-300 hover:text-rose-500 dark:hover:text-rose-400 transition-all flex items-center gap-1.5 whitespace-nowrap shadow-xs">
      <span>${item.tag}</span>
      <span class="text-[10px] text-gray-400 font-normal">(${item.count})</span>
    </button>
  `).join('');
}

function filterByTag(tag) {
  const keyword = tag.replace('#', '');
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.value = keyword;
    state.searchQuery = keyword.toLowerCase();
    renderContent();
    showToast(`กรองประเด็นตาม: ${tag}`, 'info');
  }
}

// 6. Master Render Routing
function renderContent() {
  const heroSection = document.getElementById('hero-section');

  if (state.currentView === 'curated') {
    if (heroSection) heroSection.classList.remove('hidden');
    renderHeroSpotlight();
    renderNewsGrid(getFilteredCurated());
  } else if (state.currentView === 'live') {
    if (heroSection) heroSection.classList.add('hidden');
    renderNewsGrid(getFilteredLive());
  } else if (state.currentView === 'polls') {
    if (heroSection) heroSection.classList.add('hidden');
    renderPollsView();
  } else if (state.currentView === 'bookmarks') {
    if (heroSection) heroSection.classList.add('hidden');
    renderBookmarksView();
  }
}

// 7. Filtering Logic
function getFilteredCurated() {
  let list = [...state.curatedNews];

  // Region
  if (state.regionFilter !== 'all') {
    list = list.filter(n => n.region === state.regionFilter);
  }

  // Category
  if (state.categoryFilter !== 'all') {
    list = list.filter(n => n.category === state.categoryFilter);
  }

  // Search
  if (state.searchQuery) {
    list = list.filter(n => {
      const text = `${n.title} ${n.subtitle || ''} ${n.content || ''} ${n.tags ? n.tags.join(' ') : ''}`.toLowerCase();
      return text.includes(state.searchQuery);
    });
  }

  // Sort
  sortItems(list);
  return list;
}

function getFilteredLive() {
  let list = [...state.liveNews];

  if (state.regionFilter !== 'all') {
    list = list.filter(n => n.region === state.regionFilter);
  }

  if (state.categoryFilter !== 'all') {
    list = list.filter(n => n.category === state.categoryFilter);
  }

  if (state.searchQuery) {
    list = list.filter(n => {
      const text = `${n.title} ${n.subtitle || ''} ${n.source}`.toLowerCase();
      return text.includes(state.searchQuery);
    });
  }

  sortItems(list);
  return list;
}

function sortItems(list) {
  if (state.sortBy === 'buzz') {
    list.sort((a, b) => (b.buzzScore || 0) - (a.buzzScore || 0));
  } else if (state.sortBy === 'latest') {
    list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  } else if (state.sortBy === 'views') {
    list.sort((a, b) => (b.views || 0) - (a.views || 0));
  }
}

// 8. Hero Spotlight Rendering
function renderHeroSpotlight() {
  const container = document.getElementById('hero-card-container');
  if (!container) return;

  // Find hero item for active region
  let heroItem = state.curatedNews.find(n => n.isHero && n.region === state.activeHeroRegion);
  if (!heroItem) {
    heroItem = state.curatedNews.find(n => n.region === state.activeHeroRegion) || state.curatedNews[0];
  }
  if (!heroItem) return;

  const isBookmarked = state.bookmarks.includes(heroItem.id);
  const regionLabel = heroItem.region === 'th' ? '🇹🇭 ประเด็นร้อนไทย' : '🌍 ประเด็นร้อนโลก';
  const regionBadgeClass = heroItem.region === 'th' 
    ? 'bg-blue-600/10 text-blue-500 border border-blue-500/30' 
    : 'bg-emerald-600/10 text-emerald-500 border border-emerald-500/30';

  container.innerHTML = `
    <div class="relative bg-white dark:bg-darkcard border border-gray-200 dark:border-darkborder rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
      <div class="grid grid-cols-1 lg:grid-cols-12">
        
        <!-- Hero Media Image -->
        <div class="lg:col-span-7 relative min-h-[300px] lg:min-h-[460px] overflow-hidden group">
          <img 
            src="${heroItem.image}" 
            alt="${heroItem.title}" 
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          >
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
          
          <!-- Badges on Image -->
          <div class="absolute top-4 left-4 flex flex-wrap items-center gap-2">
            <span class="px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-md flex items-center gap-1.5 flame-glow">
              <i class="fa-solid fa-fire"></i> BUZZ INDEX ${heroItem.buzzScore}%
            </span>
            <span class="px-2.5 py-1 rounded-full text-xs font-bold ${regionBadgeClass} bg-black/60 backdrop-blur text-white">
              ${regionLabel}
            </span>
          </div>

          <!-- Bottom Title Overlay (Mobile Friendly) -->
          <div class="absolute bottom-4 left-4 right-4 text-white">
            <div class="flex items-center gap-2 text-xs text-rose-300 font-semibold mb-1">
              <span><i class="fa-solid fa-newspaper mr-1"></i>${heroItem.source}</span>
              <span>•</span>
              <span><i class="fa-solid fa-clock mr-1"></i>${heroItem.readTime}</span>
              <span>•</span>
              <span><i class="fa-solid fa-eye mr-1"></i>${heroItem.views.toLocaleString()} อ่าน</span>
            </div>
            <h2 class="text-xl sm:text-2xl lg:text-3xl font-black font-heading leading-tight drop-shadow-md cursor-pointer hover:text-rose-300 transition-colors" onclick="openArticleModal('${heroItem.id}')">
              ${heroItem.title}
            </h2>
          </div>
        </div>

        <!-- Hero Highlights & Takeaways -->
        <div class="lg:col-span-5 p-6 flex flex-col justify-between space-y-4">
          
          <div>
            <!-- Header Tags -->
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">
                <i class="fa-solid fa-bolt-lightning text-amber-500 mr-1"></i> 3 สรุปประเด็นหลัก (AI TL;DR)
              </span>
              <button onclick="toggleBookmark('${heroItem.id}')" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-rose-500 transition-colors" title="${isBookmarked ? 'ยกเลิกบุ๊กมาร์ก' : 'บันทึกข่าวนี้'}">
                <i class="${isBookmarked ? 'fa-solid fa-bookmark text-rose-500' : 'fa-regular fa-bookmark'}"></i>
              </button>
            </div>

            <!-- 3 Key Bullets -->
            <ul class="space-y-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              ${(heroItem.summary || []).map((point, idx) => `
                <li class="flex items-start gap-2.5 bg-gray-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800">
                  <span class="w-5 h-5 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">${idx + 1}</span>
                  <span class="leading-snug">${point}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <!-- Quick Poll Widget in Hero -->
          ${heroItem.poll ? `
            <div class="bg-gray-100 dark:bg-slate-900/80 rounded-2xl p-4 border border-gray-200 dark:border-slate-800 space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-indigo-500 flex items-center gap-1.5">
                  <i class="fa-solid fa-square-poll-vertical"></i> เสียงสะท้อนมหาชน
                </span>
                <span class="text-[11px] text-gray-400">คลิกเพื่อโหวตทันที</span>
              </div>
              <p class="text-xs font-semibold text-gray-800 dark:text-gray-200">${heroItem.poll.question}</p>
              
              <div class="space-y-1.5" id="hero-poll-options-${heroItem.poll.id}">
                ${renderHeroPollOptions(heroItem.poll)}
              </div>
            </div>
          ` : ''}

          <!-- Hero Actions -->
          <div class="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800">
            <div class="flex items-center gap-2">
              <button onclick="openArticleModal('${heroItem.id}')" class="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-md shadow-rose-500/20 flex items-center gap-1.5 transition-all">
                <span>เจาะลึกไทม์ไลน์ & เนื้อหา</span>
                <i class="fa-solid fa-arrow-right text-[10px]"></i>
              </button>
              <button onclick="readTextSummary('${heroItem.id}')" class="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors" title="ฟังเสียงสรุป">
                <i class="fa-solid fa-volume-high"></i>
              </button>
            </div>
            
            <div class="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <span class="flex items-center gap-1"><i class="fa-solid fa-share-nodes"></i> ${heroItem.shares.toLocaleString()}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  `;
}

function renderHeroPollOptions(poll) {
  const totalVotes = poll.options.reduce((acc, curr) => acc + (curr.votes || 0), 0) || 1;
  return poll.options.map(opt => {
    const pct = Math.round(((opt.votes || 0) / totalVotes) * 100);
    return `
      <button onclick="votePoll('${poll.id}', ${opt.id})" class="w-full text-left relative overflow-hidden p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-rose-500/10 dark:hover:bg-rose-500/10 border border-gray-200 dark:border-slate-700 text-xs transition-all group">
        <div class="absolute inset-y-0 left-0 bg-rose-500/20 dark:bg-rose-500/30 transition-all duration-700" style="width: ${pct}%"></div>
        <div class="relative flex items-center justify-between z-10 font-medium">
          <span class="truncate pr-2">${opt.text}</span>
          <span class="font-bold text-rose-500 shrink-0">${pct}%</span>
        </div>
      </button>
    `;
  }).join('');
}

function toggleHeroSpotlight(region) {
  state.activeHeroRegion = region;
  const thTab = document.getElementById('hero-tab-th');
  const globalTab = document.getElementById('hero-tab-global');

  if (region === 'th') {
    thTab.className = 'px-2.5 py-1 rounded-md bg-rose-500 text-white font-semibold transition-all';
    globalTab.className = 'px-2.5 py-1 rounded-md bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-semibold transition-all';
  } else {
    globalTab.className = 'px-2.5 py-1 rounded-md bg-rose-500 text-white font-semibold transition-all';
    thTab.className = 'px-2.5 py-1 rounded-md bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-semibold transition-all';
  }

  renderHeroSpotlight();
}

// 9. Main News Grid Rendering
function renderNewsGrid(items) {
  const grid = document.getElementById('news-grid');
  const emptyState = document.getElementById('empty-state');
  const newsCount = document.getElementById('news-count');

  if (newsCount) newsCount.textContent = items.length;

  if (!items || items.length === 0) {
    if (grid) grid.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  grid.innerHTML = items.map(item => {
    const isBookmarked = state.bookmarks.includes(item.id);
    const regionBadge = item.region === 'th' ? '🇹🇭 ไทย' : '🌍 ต่างประเทศ';
    const regionClass = item.region === 'th' 
      ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' 
      : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';

    const buzzColor = item.buzzScore >= 90 ? 'text-rose-500' : 'text-amber-500';

    return `
      <article class="news-card bg-white dark:bg-darkcard border border-gray-200 dark:border-darkborder rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
        
        <div>
          <!-- Thumbnail Image -->
          <div class="relative h-48 sm:h-52 overflow-hidden cursor-pointer" onclick="openArticleModal('${item.id}')">
            <img 
              src="${item.image}" 
              alt="${item.title}" 
              loading="lazy" 
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            >
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            
            <!-- Badges -->
            <div class="absolute top-3 left-3 flex items-center gap-1.5">
              <span class="px-2 py-0.5 rounded-md text-[11px] font-bold ${regionClass} bg-black/60 backdrop-blur">
                ${regionBadge}
              </span>
              <span class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-900/70 text-gray-200 backdrop-blur">
                ${item.category}
              </span>
            </div>

            <!-- Buzz Meter Badge -->
            <div class="absolute top-3 right-3">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-black/70 text-white backdrop-blur flex items-center gap-1 border border-white/10">
                <i class="fa-solid fa-fire ${buzzColor}"></i> ${item.buzzScore || 85}%
              </span>
            </div>

            <!-- Source & Date Overlay -->
            <div class="absolute bottom-2.5 left-3 right-3 text-white flex items-center justify-between text-[11px] font-medium opacity-90">
              <span class="truncate max-w-[65%]"><i class="fa-solid fa-newspaper mr-1 text-rose-400"></i>${item.source}</span>
              <span><i class="fa-regular fa-clock mr-1"></i>${item.readTime || '3 นาที'}</span>
            </div>
          </div>

          <!-- Article Body -->
          <div class="p-4 sm:p-5 space-y-3">
            <h3 class="font-bold text-base sm:text-lg font-heading leading-snug cursor-pointer group-hover:text-rose-500 transition-colors line-clamp-2" onclick="openArticleModal('${item.id}')">
              ${item.title}
            </h3>

            <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
              ${item.subtitle || (item.summary ? item.summary[0] : '')}
            </p>

            <!-- Tags -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              ${(item.tags || []).slice(0, 3).map(tag => `
                <span class="text-[10px] font-medium text-gray-500 dark:text-gray-400 hover:text-rose-500 transition-colors cursor-pointer" onclick="filterByTag('${tag}')">
                  ${tag}
                </span>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="px-4 pb-4 pt-3 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <!-- Reactions Counter -->
          <div class="flex items-center gap-2">
            <button onclick="handleReaction('${item.id}', 'fire')" class="flex items-center gap-1 text-gray-500 hover:text-rose-500 transition-colors" title="ร้อนแรง">
              <span>🔥</span>
              <span class="font-semibold" id="react-fire-${item.id}">${item.reactions?.fire || 0}</span>
            </button>
            <button onclick="handleReaction('${item.id}', 'clap')" class="flex items-center gap-1 text-gray-500 hover:text-amber-500 transition-colors" title="ปรบมือ">
              <span>👏</span>
              <span class="font-semibold" id="react-clap-${item.id}">${item.reactions?.clap || 0}</span>
            </button>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <button onclick="toggleBookmark('${item.id}')" class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-rose-500 transition-colors" title="บันทึก">
              <i class="${isBookmarked ? 'fa-solid fa-bookmark text-rose-500' : 'fa-regular fa-bookmark'}"></i>
            </button>
            <button onclick="openArticleModal('${item.id}')" class="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white font-semibold transition-all">
              อ่านสรุป
            </button>
          </div>
        </div>

      </article>
    `;
  }).join('');
}

// 10. Article Deep-Dive Modal
function openArticleModal(id) {
  const item = state.curatedNews.find(n => n.id === id) || state.liveNews.find(n => n.id === id);
  if (!item) return;

  state.currentModalItem = item;
  const modal = document.getElementById('article-modal');
  const contentArea = document.getElementById('modal-content-area');
  const regionBadge = document.getElementById('modal-region-badge');
  const catBadge = document.getElementById('modal-category-badge');
  const bookmarkBtn = document.getElementById('modal-bookmark-btn');
  const sourceLink = document.getElementById('modal-source-link');
  const reactionsContainer = document.getElementById('modal-reactions-container');

  // Badges
  regionBadge.textContent = item.region === 'th' ? '🇹🇭 ไทย' : '🌍 ต่างประเทศ';
  regionBadge.className = item.region === 'th' ? 'px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-500' : 'px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-500';
  catBadge.textContent = item.category;

  // Source link
  if (sourceLink) sourceLink.href = item.sourceUrl || '#';

  // Bookmark icon update
  updateModalBookmarkIcon(item.id);

  // Render reactions in modal
  if (reactionsContainer) {
    reactionsContainer.innerHTML = `
      <button onclick="handleReaction('${item.id}', 'fire')" class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white text-xs font-bold transition-all">
        <span>🔥</span>
        <span id="modal-react-fire">${item.reactions?.fire || 0}</span>
      </button>
      <button onclick="handleReaction('${item.id}', 'clap')" class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white text-xs font-bold transition-all">
        <span>👏</span>
        <span id="modal-react-clap">${item.reactions?.clap || 0}</span>
      </button>
      <button onclick="handleReaction('${item.id}', 'idea')" class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white text-xs font-bold transition-all">
        <span>💡</span>
        <span id="modal-react-idea">${item.reactions?.idea || 0}</span>
      </button>
      <button onclick="handleReaction('${item.id}', 'sad')" class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-200 dark:bg-slate-800 text-gray-500 hover:text-rose-400 text-xs font-bold transition-all">
        <span>😢</span>
        <span id="modal-react-sad">${item.reactions?.sad || 0}</span>
      </button>
    `;
  }

  // Content Area
  contentArea.innerHTML = `
    <!-- Modal Hero Graphic -->
    <div class="relative rounded-2xl overflow-hidden h-60 sm:h-72 shadow-md">
      <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover">
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
      <div class="absolute bottom-4 left-4 right-4 text-white">
        <div class="text-xs text-rose-300 font-semibold mb-1 flex items-center gap-2">
          <span>${item.source}</span>
          <span>•</span>
          <span>${new Date(item.publishedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span>•</span>
          <span>ความร้อนแรง ${item.buzzScore || 85}% 🔥</span>
        </div>
        <h1 class="text-xl sm:text-2xl font-black font-heading leading-tight">${item.title}</h1>
      </div>
    </div>

    <!-- AI Executive Summary Box -->
    <div class="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-4 sm:p-5 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 text-sm">
          <i class="fa-solid fa-brain"></i> สรุปใจความสำคัญใน 30 วินาที (Executive AI Takeaways)
        </h3>
        <span class="text-[11px] px-2 py-0.5 rounded bg-rose-500 text-white font-bold">สรุปอัตโนมัติ</span>
      </div>
      <ul class="space-y-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200">
        ${(item.summary || []).map((point, idx) => `
          <li class="flex items-start gap-2">
            <span class="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">${idx + 1}</span>
            <span>${point}</span>
          </li>
        `).join('')}
      </ul>
    </div>

    <!-- Full In-Depth Narrative -->
    <div class="space-y-4">
      <h3 class="font-bold text-base font-heading">บทวิเคราะห์เจาะลึกสถานการณ์</h3>
      <p class="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line text-sm">
        ${item.content}
      </p>
    </div>

    <!-- Timeline of Events (If Available) -->
    ${item.timeline && item.timeline.length > 0 ? `
      <div class="bg-gray-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <h3 class="font-bold text-sm font-heading flex items-center gap-2">
          <i class="fa-solid fa-timeline text-indigo-400"></i>
          <span>ไทม์ไลน์ลำดับเหตุการณ์สำคัญ (Chronology)</span>
        </h3>
        <div class="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-300 dark:before:bg-indigo-800">
          ${item.timeline.map(event => `
            <div class="relative">
              <span class="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-darkcard"></span>
              <div class="font-bold text-xs text-indigo-500 dark:text-indigo-400">${event.time}</div>
              <div class="font-semibold text-xs text-gray-800 dark:text-gray-200">${event.title}</div>
              <div class="text-[11px] text-gray-500 dark:text-gray-400">${event.detail}</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Public Opinion Poll Section -->
    ${item.poll ? `
      <div class="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 rounded-2xl p-4 sm:p-5 space-y-3">
        <h3 class="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 text-sm">
          <i class="fa-solid fa-square-poll-vertical"></i> ร่วมออกเสียงโพลสำรวจความคิดเห็น
        </h3>
        <p class="text-xs font-semibold text-gray-800 dark:text-gray-200">${item.poll.question}</p>
        <div class="space-y-2" id="modal-poll-options-${item.poll.id}">
          ${renderHeroPollOptions(item.poll)}
        </div>
      </div>
    ` : ''}

    <!-- Tags -->
    <div class="flex flex-wrap gap-2 pt-2">
      ${(item.tags || []).map(tag => `
        <span class="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-xs font-medium text-gray-600 dark:text-gray-400">
          ${tag}
        </span>
      `).join('')}
    </div>
  `;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeArticleModal() {
  const modal = document.getElementById('article-modal');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = 'auto';
  stopAudioReading();
  state.currentModalItem = null;
}

function updateModalBookmarkIcon(id) {
  const btn = document.getElementById('modal-bookmark-btn');
  if (!btn) return;
  const isBookmarked = state.bookmarks.includes(id);
  btn.innerHTML = `<i class="${isBookmarked ? 'fa-solid fa-bookmark text-rose-500' : 'fa-regular fa-bookmark'}"></i>`;
}

function toggleCurrentModalBookmark() {
  if (state.currentModalItem) {
    toggleBookmark(state.currentModalItem.id);
    updateModalBookmarkIcon(state.currentModalItem.id);
  }
}

// 11. Interactive Voting
async function votePoll(pollId, optionId) {
  try {
    const res = await fetch('/api/poll/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pollId, optionId })
    });
    const result = await res.json();
    if (result.status === 'success') {
      showToast('บันทึกคะแนนโหวตของคุณเรียบร้อยแล้ว!', 'success');

      // Update in state
      const updatePollInList = (list) => {
        list.forEach(item => {
          if (item.poll && item.poll.id === pollId) {
            item.poll.options.forEach(opt => {
              if (result.votes[opt.id] !== undefined) opt.votes = result.votes[opt.id];
            });
          }
        });
      };
      updatePollInList(state.curatedNews);

      // Re-render hero poll if active
      const heroPollEl = document.getElementById(`hero-poll-options-${pollId}`);
      if (heroPollEl) {
        const item = state.curatedNews.find(n => n.poll && n.poll.id === pollId);
        if (item && item.poll) heroPollEl.innerHTML = renderHeroPollOptions(item.poll);
      }

      // Re-render modal poll if active
      const modalPollEl = document.getElementById(`modal-poll-options-${pollId}`);
      if (modalPollEl) {
        const item = state.curatedNews.find(n => n.poll && n.poll.id === pollId);
        if (item && item.poll) modalPollEl.innerHTML = renderHeroPollOptions(item.poll);
      }
    }
  } catch (err) {
    console.error('Vote error:', err);
    showToast('เกิดข้อผิดพลาดในการส่งผลโหวต', 'error');
  }
}

// 12. Interactive Reactions
async function handleReaction(newsId, type) {
  try {
    const res = await fetch('/api/reaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newsId, type })
    });
    const result = await res.json();
    if (result.status === 'success') {
      // Update item in state
      const item = state.curatedNews.find(n => n.id === newsId) || state.liveNews.find(n => n.id === newsId);
      if (item) {
        item.reactions = result.reactions;
      }

      // Update card UI
      const countEl = document.getElementById(`react-${type}-${newsId}`);
      if (countEl) {
        countEl.textContent = result.reactions[type];
        countEl.classList.add('scale-125', 'text-rose-500');
        setTimeout(() => countEl.classList.remove('scale-125', 'text-rose-500'), 300);
      }

      // Update modal UI if open
      const modalCountEl = document.getElementById(`modal-react-${type}`);
      if (modalCountEl && state.currentModalItem?.id === newsId) {
        modalCountEl.textContent = result.reactions[type];
      }

      showToast(`ขอบคุณสำหรับการส่งอารมณ์ความรู้สึก!`, 'info');
    }
  } catch (err) {
    console.error('Reaction error:', err);
  }
}

// 13. Bookmark System
function toggleBookmark(id) {
  const index = state.bookmarks.indexOf(id);
  if (index >= 0) {
    state.bookmarks.splice(index, 1);
    showToast('นำออกจากรายการบันทึกแล้ว', 'info');
  } else {
    state.bookmarks.push(id);
    showToast('บันทึกข่าวเรียบร้อย', 'success');
  }
  localStorage.setItem('tp_bookmarks', JSON.stringify(state.bookmarks));
  updateBookmarkBadge();
  renderContent();
}

function updateBookmarkBadge() {
  const badge = document.getElementById('bookmark-badge');
  if (!badge) return;
  const count = state.bookmarks.length;
  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function renderBookmarksView() {
  const bookmarkedItems = [
    ...state.curatedNews.filter(n => state.bookmarks.includes(n.id)),
    ...state.liveNews.filter(n => state.bookmarks.includes(n.id))
  ];
  renderNewsGrid(bookmarkedItems);
}

// 14. Polls Dedicated View
function renderPollsView() {
  const grid = document.getElementById('news-grid');
  const emptyState = document.getElementById('empty-state');
  const pollItems = state.curatedNews.filter(n => n.poll);

  if (pollItems.length === 0) {
    if (grid) grid.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  grid.innerHTML = pollItems.map(item => `
    <div class="bg-white dark:bg-darkcard border border-gray-200 dark:border-darkborder rounded-2xl p-5 shadow-sm space-y-4">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500">
          ${item.region === 'th' ? '🇹🇭 โพลไทย' : '🌍 โพลโลก'}
        </span>
        <span class="text-xs text-gray-400">กระแส ${item.buzzScore}% 🔥</span>
      </div>
      <h3 class="font-bold text-sm leading-snug cursor-pointer hover:text-rose-500 transition-colors" onclick="openArticleModal('${item.id}')">
        ${item.title}
      </h3>
      <div class="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-800 space-y-2">
        <p class="text-xs font-bold text-gray-800 dark:text-gray-200">${item.poll.question}</p>
        <div class="space-y-1.5" id="hero-poll-options-${item.poll.id}">
          ${renderHeroPollOptions(item.poll)}
        </div>
      </div>
    </div>
  `).join('');
}

// 15. Text-To-Speech (SpeechSynthesis)
function toggleAudioReading() {
  if (state.isSpeaking) {
    stopAudioReading();
  } else if (state.currentModalItem) {
    startAudioReading(state.currentModalItem);
  }
}

function readTextSummary(id) {
  const item = state.curatedNews.find(n => n.id === id) || state.liveNews.find(n => n.id === id);
  if (item) {
    startAudioReading(item);
  }
}

function startAudioReading(item) {
  if (!('speechSynthesis' in window)) {
    showToast('เบราว์เซอร์ของคุณไม่รองรับ Text-to-Speech', 'error');
    return;
  }

  window.speechSynthesis.cancel();

  const textToRead = `${item.title}. สรุปประเด็นสำคัญ. ${(item.summary || []).join('. ')}`;
  const utterance = new SpeechSynthesisUtterance(textToRead);
  utterance.lang = item.region === 'global' ? 'en-US' : 'th-TH';
  utterance.rate = 1.0;

  utterance.onstart = () => {
    state.isSpeaking = true;
    updateAudioUI(true);
    showToast('กำลังอ่านสรุปประเด็นด้วยเสียง...', 'info');
  };

  utterance.onend = () => {
    state.isSpeaking = false;
    updateAudioUI(false);
  };

  utterance.onerror = () => {
    state.isSpeaking = false;
    updateAudioUI(false);
  };

  state.synthUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

function stopAudioReading() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  state.isSpeaking = false;
  updateAudioUI(false);
}

function updateAudioUI(speaking) {
  const ttsLabel = document.getElementById('tts-label');
  const ttsBtn = document.getElementById('modal-tts-btn');
  if (ttsLabel) ttsLabel.textContent = speaking ? 'หยุดฟังเสียง' : 'ฟังเสียงสรุป';
  if (ttsBtn) {
    if (speaking) {
      ttsBtn.classList.add('bg-rose-500', 'text-white');
    } else {
      ttsBtn.classList.remove('bg-rose-500', 'text-white');
    }
  }
}

// 16. Share Modal Helper
function shareArticle(type) {
  const item = state.currentModalItem;
  if (!item) return;

  const url = window.location.href;
  const text = `${item.title} - เจาะประเด็น Talk of The Town บน TRENDPULSE`;

  if (type === 'copy') {
    navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
      showToast('คัดลอกลิงก์ข่าวลงคลิปบอร์ดแล้ว', 'success');
    }).catch(() => {
      showToast('ไม่สามารถคัดลอกลิงก์ได้', 'error');
    });
  } else if (type === 'x') {
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(xUrl, '_blank');
  } else if (type === 'line') {
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(lineUrl, '_blank');
  }
}

// 17. Suggest Hot Topic Modal Handlers
function openSuggestModal() {
  const modal = document.getElementById('suggest-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeSuggestModal() {
  const modal = document.getElementById('suggest-modal');
  if (modal) modal.classList.add('hidden');
}

async function submitSuggestion(e) {
  e.preventDefault();
  const title = document.getElementById('sug-title').value;
  const region = document.getElementById('sug-region').value;
  const category = document.getElementById('sug-category').value;
  const url = document.getElementById('sug-url').value;
  const reason = document.getElementById('sug-reason').value;

  try {
    const res = await fetch('/api/suggest-news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, region, category, url, reason })
    });
    const data = await res.json();
    if (data.status === 'success') {
      showToast('ส่งข้อเสนอประเด็นร้อนสำเร็จ! ขอบคุณที่ช่วยเกาะติดกระแส', 'success');
      closeSuggestModal();
      document.getElementById('suggest-form').reset();
    }
  } catch (err) {
    showToast('เกิดข้อผิดพลาดในการส่งข้อเสนอ', 'error');
  }
}

// 18. Filters and View Switchers
function switchMainView(view) {
  state.currentView = view;
  const views = ['curated', 'live', 'polls', 'bookmarks'];
  views.forEach(v => {
    const btn = document.getElementById(`nav-btn-${v}`);
    if (btn) {
      if (v === view) {
        btn.classList.add('active', 'bg-gray-100', 'dark:bg-slate-800', 'text-gray-900', 'dark:text-white');
      } else {
        btn.classList.remove('active', 'bg-gray-100', 'dark:bg-slate-800', 'text-gray-900', 'dark:text-white');
      }
    }
  });
  renderContent();
}

function setRegionFilter(region) {
  state.regionFilter = region;
  const regions = ['all', 'th', 'global'];
  regions.forEach(r => {
    const pill = document.getElementById(`region-btn-${r}`);
    if (pill) {
      if (r === region) {
        pill.classList.add('bg-white', 'dark:bg-slate-700', 'shadow-xs', 'text-rose-500', 'font-bold');
      } else {
        pill.classList.remove('bg-white', 'dark:bg-slate-700', 'shadow-xs', 'text-rose-500', 'font-bold');
      }
    }
  });
  renderContent();
}

function setCategoryFilter(cat) {
  state.categoryFilter = cat;
  const pills = document.querySelectorAll('.cat-pill');
  pills.forEach(p => {
    if (p.textContent.includes(cat) || (cat === 'all' && p.textContent.includes('ทั้งหมด'))) {
      p.className = 'cat-pill active-cat px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500 text-white whitespace-nowrap shadow-xs';
    } else {
      p.className = 'cat-pill px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800 whitespace-nowrap transition-all';
    }
  });
  renderContent();
}

function onSortChange(value) {
  state.sortBy = value;
  renderContent();
}

function resetFilters() {
  state.regionFilter = 'all';
  state.categoryFilter = 'all';
  state.searchQuery = '';
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  setRegionFilter('all');
  setCategoryFilter('all');
  renderContent();
}

function showLoading(show) {
  const loading = document.getElementById('loading-state');
  if (loading) {
    if (show) loading.classList.remove('hidden');
    else loading.classList.add('hidden');
  }
}

// 19. Toast Notification System
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const colors = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-slate-800 text-white border border-slate-700'
  };

  const icons = {
    success: 'fa-circle-check',
    error: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
  };

  toast.className = `flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold ${colors[type] || colors.info} transform transition-all duration-300 translate-y-2 opacity-0 pointer-events-auto`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type]} text-sm"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

