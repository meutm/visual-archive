const data = window.MEU_PHOTO_DATA || { albums: [], photos: [] };

const state = {
  activeAlbum: "all",
  activePhotoIndex: 0,
  visibleCount: 36,
};

const els = {
  albumList: document.querySelector("#album-list"),
  filterBar: document.querySelector(".gallery-actions"),
  grid: document.querySelector("#photo-grid"),
  status: document.querySelector("#status-card"),
  loadMore: document.querySelector("#load-more"),
  photoCount: document.querySelector("#photo-count"),
  albumCount: document.querySelector("#album-count"),
  lightbox: document.querySelector("#lightbox"),
  lightboxImage: document.querySelector("#lightbox-image"),
  lightboxTitle: document.querySelector("#lightbox-title"),
  lightboxMeta: document.querySelector("#lightbox-meta"),
};

function getAlbum(albumId) {
  return data.albums.find((album) => album.id === albumId);
}

function getVisibleAlbums() {
  return data.albums.filter((album) => getAlbumPhotos(album.id).length > 0);
}

function getAlbumPhotos(albumId) {
  return data.photos.filter((photo) => photo.albumId === albumId);
}

function getVisiblePhotos() {
  return state.activeAlbum === "all" ? data.photos : getAlbumPhotos(state.activeAlbum);
}

function renderStats() {
  els.photoCount.textContent = data.photos.length.toLocaleString("en-US");
  els.albumCount.textContent = getVisibleAlbums().length.toString();
}

function renderAlbums() {
  els.albumList.innerHTML = getVisibleAlbums()
    .map((album, index) => {
      const photos = getAlbumPhotos(album.id);

      return `
        <button class="album-card" type="button" data-album="${album.id}">
          <span class="album-card-mark">${String(index + 1).padStart(2, "0")}</span>
          <span class="album-card-stars"></span>
          <span class="album-card-content">
            <strong>${album.title}</strong>
            <em>${photos.length.toLocaleString("en-US")} photos</em>
          </span>
        </button>
      `;
    })
    .join("");
}

function renderFilters() {
  const filters = getVisibleAlbums()
    .map((album) => {
      const photos = getAlbumPhotos(album.id);

      return `
        <button class="filter-button" type="button" data-album="${album.id}">
          ${album.title} · ${photos.length}
        </button>
      `;
    })
    .join("");

  els.filterBar.innerHTML = `
    <button class="filter-button is-active" type="button" data-album="all">
      All · ${data.photos.length}
    </button>
    ${filters}
  `;
}

function renderPhotos() {
  const photos = getVisiblePhotos();
  const visiblePhotos = photos.slice(0, state.visibleCount);

  if (!photos.length) {
    els.status.hidden = false;
    els.status.textContent = "No photos in this album.";
    els.grid.innerHTML = "";
    els.loadMore.hidden = true;
    return;
  }

  els.status.hidden = true;
  els.grid.innerHTML = visiblePhotos
    .map((photo, index) => {
      const album = getAlbum(photo.albumId);

      return `
        <figure class="photo-card" data-photo-index="${index}">
          <img src="${photo.thumbnailUrl}" alt="${photo.title}" loading="lazy" decoding="async" />
          <figcaption>
            <span>${album?.title || ""}</span>
          </figcaption>
        </figure>
      `;
    })
    .join("");

  els.loadMore.hidden = visiblePhotos.length >= photos.length;
  els.loadMore.textContent = `Load more · ${photos.length - visiblePhotos.length}`;
}

function setActiveAlbum(albumId) {
  state.activeAlbum = albumId;
  state.visibleCount = 36;

  document.querySelectorAll("[data-album]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.album === albumId);
  });

  renderPhotos();
  document.querySelector("#gallery").scrollIntoView({ behavior: "smooth", block: "start" });
}

function openLightbox(index) {
  const photos = getVisiblePhotos();
  const photo = photos[index];
  if (!photo) return;

  const album = getAlbum(photo.albumId);
  state.activePhotoIndex = index;
  els.lightboxImage.src = photo.largeUrl;
  els.lightboxImage.alt = photo.title;
  els.lightboxTitle.textContent = photo.title;
  els.lightboxMeta.textContent = album?.title || "";
  els.lightbox.showModal();
}

function moveLightbox(direction) {
  if (!els.lightbox.open) return;

  const photos = getVisiblePhotos();
  if (!photos.length) return;

  const nextIndex = (state.activePhotoIndex + direction + photos.length) % photos.length;
  openLightbox(nextIndex);
}

document.addEventListener("click", (event) => {
  const albumButton = event.target.closest("[data-album]");
  if (albumButton) {
    setActiveAlbum(albumButton.dataset.album);
    return;
  }

  const photoCard = event.target.closest("[data-photo-index]");
  if (photoCard) {
    openLightbox(Number(photoCard.dataset.photoIndex));
  }
});

document.querySelector(".lightbox-close").addEventListener("click", () => {
  els.lightbox.close();
});

els.loadMore.addEventListener("click", () => {
  state.visibleCount += 36;
  renderPhotos();
});

els.lightbox.addEventListener("click", (event) => {
  if (event.target === els.lightbox) {
    els.lightbox.close();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && els.lightbox.open) {
    els.lightbox.close();
  }

  if (event.key === "ArrowRight") {
    moveLightbox(1);
  }

  if (event.key === "ArrowLeft") {
    moveLightbox(-1);
  }
});

if (!data.photos.length) {
  els.status.hidden = false;
  els.status.textContent = "No photos loaded.";
} else {
  renderStats();
  renderAlbums();
  renderFilters();
  renderPhotos();
}
