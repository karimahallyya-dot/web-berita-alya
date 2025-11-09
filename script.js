const apiKey = "c3af6efe9a0f4b0e83240d9a3d448ff1";

$(document).ready(function () {

  // Load navbar/footer
  $("#navbar-container").load("navbar.html");
  $("#footer-container").load("footer.html");

  // Load news pertama
  fetchNews("general");

  // Klik kategori
  $(document).on("click", ".category-btn", function () {
    $(".category-btn").removeClass("active");
    $(this).addClass("active");
    const category = $(this).data("category");
    fetchNews(category);
  });

  // Search
  $("#search-btn").on("click", function () {
    const term = $("#search-input").val().trim();
    if (term) fetchNews(null, term);
  });

  $("#search-input").keypress(function (e) {
    if (e.which === 13) $("#search-btn").click();
  });
});


function fetchNews(category = "general", searchTerm = null) {
  const container = $("#news-container");
  container.html(`<p class="text-center text-muted">Loading news...</p>`);

  // === URL NewsAPI ===
  const apiUrl = searchTerm
    ? `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchTerm)}&sortBy=publishedAt&apiKey=${apiKey}`
    : `https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${apiKey}`;

  // === CORS Proxy (tanpa file PHP) ===
  const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;

  $.getJSON(proxy, function (response) {
    let data;

    try {
      data = JSON.parse(response.contents);
    } catch (e) {
      container.html(`<p class="text-center text-danger">Failed to parse news data.</p>`);
      return;
    }

    if (!data.articles || data.articles.length === 0) {
      container.html(`<p class="text-center text-muted">No news available.</p>`);
      return;
    }

    container.empty();

    data.articles.slice(0, 9).forEach(a => {
      container.append(`
        <div class="col-md-4 col-sm-6 mb-4">
          <div class="card h-100 shadow-sm border-0">
            <img src="${a.urlToImage || 'https://via.placeholder.com/400x200'}"
                 class="card-img-top"
                 style="height:180px;object-fit:cover;">

            <div class="card-body d-flex flex-column">
              <h6 class="fw-bold text-primary">${a.title || 'No Title'}</h6>
              <small class="text-muted mb-2">${a.source?.name || ''}</small>
              <p class="text-truncate">${a.description || 'No description available.'}</p>
              <a href="${a.url}" target="_blank"
                 class="btn btn-primary btn-sm mt-auto">Read More</a>
            </div>
          </div>
        </div>
      `);
    });
  }).fail(() => {
    container.html(`<p class="text-center text-danger">Failed to load news (Proxy/API error)</p>`);
  });
}


