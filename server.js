const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');

// MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

// RSS Cache
const rssCache = {
  th: { timestamp: 0, items: [] },
  global: { timestamp: 0, items: [] }
};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Helper to read JSON
function readJson(filename, defaultValue = {}) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) return defaultValue;
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err.message);
    return defaultValue;
  }
}

// Helper to write JSON
function writeJson(filename, data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filename}:`, err.message);
    return false;
  }
}

// Parse RSS XML helper
function parseRssXml(xml, region = 'th') {
  const items = [];
  const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || [];

  const defaultImages = {
    th: [
      'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80'
    ],
    global: [
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'
    ]
  };

  itemMatches.slice(0, 15).forEach((itemXml, idx) => {
    const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const linkMatch = itemXml.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
    const pubDateMatch = itemXml.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i);
    const descMatch = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
    const sourceMatch = itemXml.match(/<source[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/source>/i);

    let rawTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    let link = linkMatch ? linkMatch[1].trim() : '#';
    let pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();
    let source = sourceMatch ? sourceMatch[1].replace(/<[^>]+>/g, '').trim() : (region === 'th' ? 'สำนักข่าวไทย' : 'Global Wire');
    let desc = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // Split title and source if in "Title - Source" format
    let cleanTitle = rawTitle;
    if (rawTitle.includes(' - ')) {
      const parts = rawTitle.split(' - ');
      if (parts.length > 1) {
        source = parts.pop().trim();
        cleanTitle = parts.join(' - ').trim();
      }
    }

    if (cleanTitle) {
      // Determine category roughly by keywords
      let category = 'ประเด็นร้อน';
      const text = (cleanTitle + ' ' + desc).toLowerCase();
      if (text.includes('เศรษฐกิจ') || text.includes('หุ้น') || text.includes('การเงิน') || text.includes('economy') || text.includes('market') || text.includes('bank')) {
        category = 'เศรษฐกิจ';
      } else if (text.includes('การเมือง') || text.includes('รัฐสภา') || text.includes('นายก') || text.includes('election') || text.includes('minister') || text.includes('politics')) {
        category = 'การเมือง';
      } else if (text.includes('เทคโนโลยี') || text.includes('ai') || text.includes('ชิป') || text.includes('tech') || text.includes('cyber') || text.includes('apple')) {
        category = 'เทคโนโลยี';
      } else if (text.includes('บันเทิง') || text.includes('ดารา') || text.includes('ซีรีส์') || text.includes('celebrity') || text.includes('music') || text.includes('movie')) {
        category = 'บันเทิง';
      } else if (text.includes('สิ่งแวดล้อม') || text.includes('โลกร้อน') || text.includes('climate') || text.includes('พายุ') || text.includes('น้ำท่วม')) {
        category = 'สิ่งแวดล้อม';
      } else if (text.includes('กีฬา') || text.includes('บอล') || text.includes('sport') || text.includes('football')) {
        category = 'กีฬา';
      }

      const imgList = defaultImages[region] || defaultImages.th;
      const image = imgList[idx % imgList.length];

      items.push({
        id: `rss-${region}-${idx + 1}`,
        region,
        category,
        isLiveFeed: true,
        isHero: false,
        buzzScore: 88 - (idx * 2),
        views: Math.floor(45000 + Math.random() * 50000),
        shares: Math.floor(3000 + Math.random() * 8000),
        title: cleanTitle,
        subtitle: desc || 'อัปเดตสดจากสำนักข่าวชั้นนำ เกาะติดความเคลื่อนไหวล่าสุด',
        source,
        sourceUrl: link,
        publishedAt: pubDate,
        readTime: '2 นาที',
        image,
        summary: [
          'รายงานสถานการณ์สดจากแหล่งข่าวต้นทาง',
          'ประเด็นที่กำลังได้รับความสนใจและถูกแชร์ในโลกโซเชียลมีเดีย',
          'สามารถกดอ่านเนื้อหาฉบับเต็มได้จากลิงก์สำนักข่าวทางการ'
        ],
        content: desc ? `${desc}\n\nติดตามรายละเอียดฉบับเต็มและภาพข่าวเพิ่มเติมได้จากสำนักข่าว ${source}` : `เกาะติดประเด็นร้อน '${cleanTitle}' จากสำนักข่าว ${source} อ่านรายละเอียดเพิ่มเติมได้ที่ลิงก์ต้นทาง`,
        reactions: { fire: 240 + idx * 10, clap: 120 + idx * 5, idea: 80, sad: 15 },
        tags: [`#${category}`, `#${region === 'th' ? 'ข่าวไทย' : 'ข่าวต่างประเทศ'}`, '#ข่าวด่วนวันนี้']
      });
    }
  });

  return items;
}

// Fetch live RSS feed
async function fetchLiveFeed(region = 'th') {
  const now = Date.now();
  if (rssCache[region] && rssCache[region].items.length > 0 && (now - rssCache[region].timestamp < CACHE_TTL_MS)) {
    return rssCache[region].items;
  }

  const feedUrl = region === 'th'
    ? 'https://news.google.com/rss?hl=th&gl=TH&ceid=TH:th'
    : 'https://news.google.com/rss/headlines/section/topic/WORLD?hl=en&gl=US&ceid=US:en';

  try {
    const res = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const xml = await res.text();
    const items = parseRssXml(xml, region);
    if (items.length > 0) {
      rssCache[region] = { timestamp: now, items };
      return items;
    }
  } catch (err) {
    console.error(`Fetch RSS (${region}) error:`, err.message);
  }

  return rssCache[region] ? rssCache[region].items : [];
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Router
  if (pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // 1. GET /api/news
    if (pathname === '/api/news' && req.method === 'GET') {
      const region = parsedUrl.query.region || 'all'; // 'all' | 'th' | 'global'
      const category = parsedUrl.query.category || 'all';
      const search = (parsedUrl.query.search || '').trim().toLowerCase();
      const includeLive = parsedUrl.query.includeLive === 'true';

      let curated = readJson('curated-news.json', []);
      const polls = readJson('polls.json', {});
      const reactions = readJson('reactions.json', {});

      // Merge dynamic polls and reactions
      curated = curated.map(item => {
        const itemCopy = { ...item };
        if (itemCopy.poll && polls[itemCopy.poll.id]) {
          const pollData = polls[itemCopy.poll.id];
          itemCopy.poll.options = itemCopy.poll.options.map(opt => ({
            ...opt,
            votes: pollData[opt.id] !== undefined ? pollData[opt.id] : opt.votes
          }));
        }
        if (reactions[itemCopy.id]) {
          itemCopy.reactions = { ...itemCopy.reactions, ...reactions[itemCopy.id] };
        }
        return itemCopy;
      });

      let results = [...curated];

      // Optionally attach live RSS items
      if (includeLive) {
        if (region === 'all' || region === 'th') {
          const thLive = await fetchLiveFeed('th');
          results = results.concat(thLive.slice(0, 6));
        }
        if (region === 'all' || region === 'global') {
          const globalLive = await fetchLiveFeed('global');
          results = results.concat(globalLive.slice(0, 6));
        }
      }

      // Filter by Region
      if (region !== 'all') {
        results = results.filter(item => item.region === region);
      }

      // Filter by Category
      if (category !== 'all') {
        results = results.filter(item => item.category === category);
      }

      // Filter by Search Query
      if (search) {
        results = results.filter(item => {
          const text = `${item.title} ${item.subtitle || ''} ${item.source} ${item.tags ? item.tags.join(' ') : ''}`.toLowerCase();
          return text.includes(search);
        });
      }

      // Sort by buzzScore desc
      results.sort((a, b) => (b.buzzScore || 0) - (a.buzzScore || 0));

      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'success',
        count: results.length,
        data: results
      }));
      return;
    }

    // 2. GET /api/live-rss
    if (pathname === '/api/live-rss' && req.method === 'GET') {
      const region = parsedUrl.query.region || 'th'; // 'th' or 'global'
      const items = await fetchLiveFeed(region);
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'success',
        region,
        updatedAt: new Date(rssCache[region]?.timestamp || Date.now()).toISOString(),
        count: items.length,
        data: items
      }));
      return;
    }

    // 3. POST /api/poll/vote
    if (pathname === '/api/poll/vote' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const { pollId, optionId } = JSON.parse(body);
          if (!pollId || optionId === undefined) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Missing pollId or optionId' }));
            return;
          }

          const polls = readJson('polls.json', {});
          if (!polls[pollId]) polls[pollId] = {};
          polls[pollId][optionId] = (polls[pollId][optionId] || 0) + 1;
          writeJson('polls.json', polls);

          // Calculate total & percentages
          const totalVotes = Object.values(polls[pollId]).reduce((a, b) => a + b, 0);
          res.writeHead(200);
          res.end(JSON.stringify({
            status: 'success',
            pollId,
            totalVotes,
            votes: polls[pollId]
          }));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        }
      });
      return;
    }

    // 4. POST /api/reaction
    if (pathname === '/api/reaction' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const { newsId, type } = JSON.parse(body);
          const validTypes = ['fire', 'clap', 'idea', 'sad'];
          if (!newsId || !validTypes.includes(type)) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid newsId or reaction type' }));
            return;
          }

          const reactions = readJson('reactions.json', {});
          if (!reactions[newsId]) {
            reactions[newsId] = { fire: 0, clap: 0, idea: 0, sad: 0 };
          }
          reactions[newsId][type] = (reactions[newsId][type] || 0) + 1;
          writeJson('reactions.json', reactions);

          res.writeHead(200);
          res.end(JSON.stringify({
            status: 'success',
            newsId,
            reactions: reactions[newsId]
          }));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        }
      });
      return;
    }

    // 5. GET /api/trends
    if (pathname === '/api/trends' && req.method === 'GET') {
      const trends = {
        topHashtags: [
          { tag: '#Bitcoin', count: '162.4K', growth: '+58%' },
          { tag: '#TalkOfTheTown', count: '148.5K', growth: '+34%' },
          { tag: '#นโยบายเศรษฐกิจ', count: '92.3K', growth: '+28%' },
          { tag: '#AIRevolution', count: '85.1K', growth: '+45%' },
          { tag: '#สมรสเท่าเทียม', count: '76.4K', growth: '+52%' },
          { tag: '#หมูเด้ง', count: '69.8K', growth: '+15%' },
          { tag: '#แก๊งคอลเซ็นเตอร์', count: '54.2K', growth: '+19%' },
          { tag: '#สงครามการค้า', count: '41.0K', growth: '+22%' }
        ],
        buzzMetrics: {
          totalMentionsToday: '1,429,800',
          sentimentDistribution: { positive: '46%', neutral: '34%', negative: '20%' },
          activeHotTopics: 18,
          lastUpdated: new Date().toLocaleTimeString('th-TH')
        }
      };

      res.writeHead(200);
      res.end(JSON.stringify({ status: 'success', data: trends }));
      return;
    }

    // 6. POST /api/suggest-news
    if (pathname === '/api/suggest-news' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          const suggestions = readJson('suggestions.json', []);
          const newSuggestion = {
            id: `sug-${Date.now()}`,
            ...payload,
            createdAt: new Date().toISOString()
          };
          suggestions.unshift(newSuggestion);
          writeJson('suggestions.json', suggestions);

          res.writeHead(200);
          res.end(JSON.stringify({ status: 'success', message: 'บันทึกประเด็นที่เสนอเรียบร้อย', data: newSuggestion }));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        }
      });
      return;
    }

    // Fallback 404 for unknown API
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
    return;
  }

  // Static File Serving
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // Security: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Single Page Application fallback to index.html if not found
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        res.end('Server Error loading file');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

// Start Server with fallback port
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🔥 Talk of The Town Hub (กระแสเมือง) is running!`);
  console.log(`📡 Local Server URL: http://localhost:${PORT}`);
  console.log(`🌍 Press Ctrl+C to stop`);
  console.log(`=======================================================`);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    const nextPort = PORT + 1;
    console.warn(`Port ${PORT} in use, attempting port ${nextPort}...`);
    server.listen(nextPort);
  } else {
    console.error('Server error:', e);
  }
});

