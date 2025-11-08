$(document).ready(function () {
  const API_KEY = '851bdcb35c914ef78c3eb1b139d71a4e';
  const BASE_URL = 'https://newsapi.org/v2';
  const newsContainer = $('#news-container');
  let currentCategory = 'general';

  fetchNews(currentCategory);

  $('.category-btn').on('click', function () {
    $('.category-btn').removeClass('active');
    $(this).addClass('active');
    currentCategory = $(this).data('category');
    fetchNews(currentCategory);
  });

  $('#search-btn').on('click', function () {
    const term = $('#search-input').val().trim();
    if (term) fetchNews(currentCategory, term);
  });

  $('#search-input').on('keypress', function (e) {
    if (e.which === 13) $('#search-btn').click();
  });

  function fetchNews(category, searchTerm = '') {
    newsContainer.html(`
      <div class="loading">
        <i class="fas fa-spinner"></i>
        <p>Memuat berita...</p>
      </div>
    `);

    let url = searchTerm
      ? `${BASE_URL}/everything?q=${encodeURIComponent(
          searchTerm
        )}&sortBy=publishedAt&apiKey=${API_KEY}`
      : `${BASE_URL}/top-headlines?category=${category}&country=us&apiKey=${API_KEY}`;

    $.getJSON(url, function (data) {
      if (data.articles && data.articles.length > 0) {
        displayNews(data.articles);
      } else {
        newsContainer.html(`
          <div class="text-center text-muted py-5">
            <i class="fas fa-newspaper fa-2x mb-2"></i>
            <p>Tidak ada berita ditemukan.</p>
          </div>
        `);
      }
    }).fail(function () {
      newsContainer.html(`
        <div class="text-center text-danger py-5">
          <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
          <p>Gagal memuat berita. Periksa koneksi atau API key Anda.</p>
        </div>
      `);
    });
  }

  function displayNews(articles) {
    newsContainer.empty();
    articles.forEach((a) => {
      const date = new Date(a.publishedAt).toLocaleDateString();
      const imgUrl =
        a.urlToImage ||
        'https://via.placeholder.com/400x200?text=No+Image+Available';
      const newsUrl = a.url ? a.url : '#';
      const card = `
        <div class="news-card shadow-sm rounded mb-4">
          <div class="news-image">
            <img src="${imgUrl}" alt="${a.title}" class="img-fluid rounded-top">
          </div>
          <div class="news-content p-3">
            <div class="news-source d-flex justify-content-between small text-muted mb-2">
              <span>${a.source.name || 'Unknown'}</span>
              <span>${date}</span>
            </div>
            <h5 class="news-title fw-semibold">${a.title}</h5>
            <p class="news-desc">${a.description || 'No description available.'}</p>
            <a href="${newsUrl}" target="_blank" rel="noopener noreferrer" class="news-link text-decoration-none fw-bold text-primary">
              Read more <i class="fas fa-arrow-right"></i>
            </a>
          </div>
        </div>
      `;
      newsContainer.append(card);
    });
  }
});