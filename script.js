$(document).ready(function () {
  const API_KEY = 'c3af6efe9a0f4b0e83240d9a3d448ff1';
  const BASE_URL = 'https://newsapi.org/v2';
  const PROXY = 'https://api.allorigins.win/raw?url=';
  const newsContainer = $('#news-container');
  let currentCategory = 'general';

  // Load navbar & footer (cek keberadaan elemen agar tidak error)
  if ($('#navbar-container').length) {
    $('#navbar-container').load('navbar.html', function () {
      const current = location.pathname.split('/').pop();
      $('.nav-link').each(function () {
        if ($(this).attr('href') === current) $(this).addClass('active');
      });
    });
  }
  if ($('#footer-container').length) $('#footer-container').load('footer.html');

  // Inisialisasi
  fetchNews(currentCategory);

  // Event category (cek keberadaan)
  $(document).on('click', '.news-category', function () {
    $('.news-category').removeClass('active');
    $(this).addClass('active');
    currentCategory = $(this).data('category') || 'general';
    fetchNews(currentCategory);
  });

  // Optional search elements (jika ada di HTML)
  $(document).on('click', '#search-btn', function () {
    const term = ($('#search-input').val() || '').trim();
    if (term) fetchNews(currentCategory, term);
  });
  $(document).on('keypress', '#search-input', function (e) {
    if (e.which === 13) $('#search-btn').click();
  });

  // Fungsi utama ambil berita
  function fetchNews(category, searchTerm = '') {
    newsContainer.html(`
      <div class="text-center py-5 text-muted">
        <i class="fas fa-spinner fa-spin fa-2x mb-3"></i>
        <p>Memuat berita...</p>
      </div>
    `);

    let apiUrl = searchTerm
      ? `${BASE_URL}/everything?q=${encodeURIComponent(searchTerm)}&sortBy=publishedAt&apiKey=${API_KEY}`
      : `${BASE_URL}/top-headlines?country=us&category=${category}&apiKey=${API_KEY}`;

    const url = PROXY + encodeURIComponent(apiUrl);

    // Gunakan jQuery .ajax supaya bisa akses raw responseText jika perlu
    $.ajax({
      url: url,
      method: 'GET',
      dataType: 'json', // harapannya kita dapat JSON. Jika bukan, kita fallback di success.
      timeout: 15000,
      success: function (data) {
        // AllOrigins / beberapa proxy kadang bungkus respons di .contents (string)
        try {
          const normalized = normalizeProxyResponse(data);
          handleNewsResponse(normalized);
        } catch (err) {
          console.error('Parsing success response failed:', err, data);
          showLoadError();
        }
      },
      error: function (xhr, status, err) {
        // Kadang server mengembalikan 200 tapi jQuery treat error; coba parse responseText
        console.warn('Ajax error', status, err);
        const text = xhr && xhr.responseText ? xhr.responseText : null;
        if (text) {
          try {
            // Jika proxy mengembalikan JSON string
            const parsed = tryParseMaybeWrappedJson(text);
            const normalized = normalizeProxyResponse(parsed);
            handleNewsResponse(normalized);
            return;
          } catch (e) {
            console.error('Fallback parse failed:', e, text);
          }
        }
        showLoadError();
      }
    });
  }

  // Normalisasi respons dari berbagai proxy
  function normalizeProxyResponse(resp) {
    // Jika sudah objek NewsAPI (status: 'ok')
    if (resp && resp.status === 'ok' && Array.isArray(resp.articles)) return resp;

    // AllOrigins raw sometimes returns the actual JSON directly (handled above),
    // but some proxies return { contents: "...json string..." }
    if (resp && typeof resp === 'object' && typeof resp.contents === 'string') {
      const maybe = tryParseMaybeWrappedJson(resp.contents);
      if (maybe && maybe.status === 'ok') return maybe;
    }

    // If resp is a string of JSON (rare here because jQuery parsed it), try parse
    if (typeof resp === 'string') {
      const parsed = tryParseMaybeWrappedJson(resp);
      if (parsed && parsed.status === 'ok') return parsed;
    }

    // Kalau tidak sesuai, lempar error agar ditangani
    throw new Error('Response not valid NewsAPI format');
  }

  // Coba parse JSON yang mungkin dibungkus atau sudah string
  function tryParseMaybeWrappedJson(str) {
    if (!str) throw new Error('Empty string to parse');
    // Hapus newline/spaces awal
    const trimmed = str.trim();
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      // Beberapa proxy bungkus balik di tag HTML atau escape — coba cari objek JSON di dalam string
      const firstBrace = trimmed.indexOf('{');
      const lastBrace = trimmed.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const sub = trimmed.substring(firstBrace, lastBrace + 1);
        return JSON.parse(sub);
      }
      throw e;
    }
  }

  // Tangani data bila normal
  function handleNewsResponse(data) {
    if (!data || !data.articles || !data.articles.length) {
      newsContainer.html(`
        <div class="text-center text-muted py-5">
          <i class="fas fa-newspaper fa-2x mb-2"></i>
          <p>Tidak ada berita ditemukan.</p>
        </div>
      `);
      return;
    }
    displayNews(data.articles);
  }

  // Tampilkan pesan error
  function showLoadError() {
    newsContainer.html(`
      <div class="text-center text-danger py-5">
        <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
        <p>Gagal memuat berita. Periksa koneksi atau API key Anda (cek console untuk detail).</p>
      </div>
    `);
  }

  // Render berita
  function displayNews(articles) {
    newsContainer.empty();
    articles.slice(0, 9).forEach((a) => {
      const date = a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : '';
      const imgUrl = a.urlToImage || 'https://via.placeholder.com/400x200?text=No+Image+Available';
      const newsUrl = a.url || '#';
      const card = `
        <div class="col-md-4 col-sm-6 mb-4">
          <div class="card h-100 shadow-sm border-0">
            <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(a.title || '')}" class="card-img-top" style="height:180px;object-fit:cover;">
            <div class="card-body d-flex flex-column">
              <div class="d-flex justify-content-between small text-muted mb-2">
                <span>${escapeHtml((a.source && a.source.name) || 'Unknown')}</span>
                <span>${escapeHtml(date)}</span>
              </div>
              <h6 class="fw-bold text-primary">${escapeHtml(a.title || 'No Title')}</h6>
              <p class="text-truncate">${escapeHtml(a.description || 'No description available.')}</p>
              <a href="${escapeHtml(newsUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm mt-auto">
                Read More <i class="fas fa-arrow-right ms-1"></i>
              </a>
            </div>
          </div>
        </div>
      `;
      newsContainer.append(card);
    });
  }

  // Simple HTML escape to avoid broken markup
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
});

