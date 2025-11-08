$(document).ready(function () {
  const API_KEY = 'ce35ce93c19f45689d2fea0c01902bb1';
  const BASE_URL = 'https://newsapi.org/v2';
  const newsContainer = $('#news-container');
  let currentCategory = 'general';

  // Load navbar dan footer
  $('#navbar-container').load('navbar.html', function () {
    const current = location.pathname.split('/').pop();
    $('.nav-link').each(function () {
      if ($(this).attr('href') === current) {
        $(this).addClass('active');
      }
    });
  });

  $('#footer-container').load('footer.html');

  // Muat berita pertama kali
  fetchNews(currentCategory);

  // Klik kategori berita
  $('.news-category').on('click', function () {
    $('.news-category').removeClass('active');
    $(this).addClass('active');
    currentCategory = $(this).data('category');
    fetchNews(currentCategory);
  });

  // Fungsi utama untuk mengambil berita
  function fetchNews(category, searchTerm = '') {
    newsContainer.html(`
      <div class="text-center py-5 text-muted">
        <i class="fas fa-spinner fa-spin fa-2x mb-3"></i>
        <p>Memuat berita...</p>
      </div>
    `);

    let url = searchTerm
      ? `${BASE_URL}/everything?q=${encodeURIComponent(searchTerm)}&sortBy=publishedAt&apiKey=${API_KEY}`
      : `${BASE_URL}/top-headlines?country=us&category=${category}&apiKey=${API_KEY}`;

    // Gunakan proxy agar bisa di-host di Vercel
    const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);

    $.getJSON(proxyUrl, function (data) {
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

  // Fungsi menampilkan berita
  function displayNews(articles) {
    newsContainer.empty();
    articles.slice(0, 9).forEach((a) => {
      const date = new Date(a.publishedAt).toLocaleDateString();
      const imgUrl = a.urlToImage || 'https://via.placeholder.com/400x200?text=No+Image+Available';
      const newsUrl = a.url || '#';
      const card = `
        <div class="col-md-4 col-sm-6 mb-4">
          <div class="card h-100 shadow-sm border-0">
            <img src="${imgUrl}" alt="${a.title}" class="card-img-top" style="height:180px;object-fit:cover;">
            <div class="card-body d-flex flex-column">
              <div class="d-flex justify-content-between small text-muted mb-2">
                <span>${a.source?.name || 'Unknown'}</span>
                <span>${date}</span>
              </div>
              <h6 class="fw-bold text-primary">${a.title || 'No Title'}</h6>
              <p class="text-truncate">${a.description || 'No description available.'}</p>
              <a href="${newsUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm mt-auto">
                Read More <i class="fas fa-arrow-right ms-1"></i>
              </a>
            </div>
          </div>
        </div>
      `;
      newsContainer.append(card);
    });
  }
});
