document.addEventListener('DOMContentLoaded', () => {
  const searchHistory = document.getElementById('search-history');
  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');
  const resetButton = document.getElementById('reset-button');
  const loader = document.getElementById('loader');
  const cardsContainer = document.getElementById('cards-container');
  const queueContainer = document.querySelector('.queue-container');

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  const showLoader = () => {
    loader.style.display = 'flex';
    cardsContainer.style.display = 'none';
  };

  const hideLoader = () => {
    loader.style.display = 'none';
    cardsContainer.style.display = 'flex';
    cardsContainer.scrollTop = 0;
  };

  const handleFallbackImage = (img) => {
    img.src = './default-podcast.png';
    return img;
  };

  const handleImageLoad = (limit) => {
    const images = cardsContainer.getElementsByTagName('img');
    let imagesToLoad = Math.min(images.length, limit);

    if (imagesToLoad === 0) {
      hideLoader();
      return;
    }

    Array.from(images)
      .slice(0, limit)
      .forEach((img) => {
        img.onload = img.onerror = () => {
          imagesToLoad--;
          if (img.complete && !img.naturalWidth) {
            img = handleFallbackImage(img);
          }
          if (imagesToLoad === 0) {
            hideLoader();
            lazyLoadImages(limit);
          }
        };
      });
  };

  const lazyLoadImages = (start) => {
    const remainingImages = Array.from(
      cardsContainer.getElementsByTagName('img')
    ).slice(start);

    const lazyLoadObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          let img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.onload = img.onerror = () => {
              if (img.complete && !img.naturalWidth) {
                img = handleFallbackImage(img);
              }
              lazyLoadObserver.unobserve(img);
            };
          } else {
            img = handleFallbackImage(img);
            lazyLoadObserver.unobserve(img);
          }
        }
      });
    });

    remainingImages.forEach((img) => {
      lazyLoadObserver.observe(img);
    });
  };

  const resetSearchHistory = () => {
    searchHistory.innerText = '';
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Select a previous search';
    searchHistory.appendChild(option);
  };

  const loadSearchHistory = () => {
    const savedSearches =
      JSON.parse(localStorage.getItem('searchHistory')) || [];
    resetSearchHistory();
    savedSearches.forEach((searchText) => {
      const option = document.createElement('option');
      option.value = searchText;
      option.textContent = searchText;
      searchHistory.appendChild(option);
    });
  };

  const createCard = (podcast) => {
    const card = document.createElement('div');
    card.className = 'card pointer';
    card.innerHTML = `
    <img src="${podcast.image || './default-podcast.png'}" alt="${
      podcast.title
    }" />
    <div class="card-content">
      <h3>${podcast.title}</h3>
      <p>${podcast.description}</p>
      <p class="episode-count">Episodes: ${podcast.episodeCount}</p>
      <p class="pub-date">Newest Episode: ${
        podcast.newestItemPubdate
          ? formatDate(podcast.newestItemPubdate)
          : 'Not available'
      }</p>
    </div>
  `;

    card.addEventListener('click', () =>
      loadEpisodes(podcast.itunesId, podcast.episodeCount)
    );

    return card;
  };

  const createEpisodeCard = (episode) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
    <img src="${
      episode.image || episode.feedImage || './default-podcast.png'
    }" alt="${episode.title}" />
    <div class="card-content">
      <h3>${episode.title}</h3>
      <div class="icon-container">
        <i class="fas fa-play-circle mr-10" title="Play Podcast"></i>
        <i class="fas fa-list" title="Add to Queue"></i>
        <p class="pub-date-alt">Published: ${
          episode.datePublished
            ? formatDate(episode.datePublished)
            : 'Not available'
        }</p>
      </div>
      <p>${episode.description}</p>
    </div>
  `;

    const playBtnIcon = card.querySelector('.fa-play-circle');
    playBtnIcon.addEventListener('click', () => {
      loadPodcast(episode);
    });

    const queueBtnIcon = card.querySelector('.fa-list');
    queueBtnIcon.addEventListener('click', () => {
      if (saveQueue(episode)) {
        const card = createQueueCard(episode);
        queueContainer.appendChild(card);
      }
    });

    return card;
  };

  let queueItems = [];

  const saveQueue = (episode) => {
    if (queueItems.some((item) => item.title === episode.title)) return false;

    queueItems.push(episode);
    localStorage.setItem('queue', JSON.stringify(queueItems));
    return true;
  };

  const loadQueue = () => {
    queueContainer.innerText = '';
    const savedQueue = JSON.parse(localStorage.getItem('queue'));
    if (savedQueue) queueItems = [];
    savedQueue.forEach((episode) => {
      const card = createQueueCard(episode);
      queueContainer.appendChild(card);
      queueItems.push(episode);
    });
  };

  const removeFromQueue = (episode) => {
    queueItems = queueItems.filter((item) => item.id !== episode.id);
    localStorage.setItem('queue', JSON.stringify(queueItems));
    const queueElements = document.querySelectorAll('.queue-item');
    queueElements.forEach((item) => {
      const title = item.querySelector('h3').innerText;
      if (title === episode.title) item.remove();
    });
  };

  const createQueueCard = (episode) => {
    const card = document.createElement('div');
    card.className = 'queue-item';
    card.innerHTML = `
    <img src="${
      episode.image || episode.feedImage || './default-podcast.png'
    }" alt="${episode.title}" />
    <div class="queue-content">
      <h3>${episode.title}</h3>
      <div class="icon-container">
        <i class="fas fa-play-circle mb-10" title="Play Podcast"></i>
        <i class="fas fa-trash-alt" title="Remove from Queue"></i>
      </div>
    </div>
  `;

    const playBtnIcon = card.querySelector('.fa-play-circle');
    playBtnIcon.addEventListener('click', () => {
      loadPodcast(episode);
    });

    const removeBtnIcon = card.querySelector('.fa-trash-alt');
    removeBtnIcon.addEventListener('click', () => {
      removeFromQueue(episode);
    });

    return card;
  };

  const saveSearchHistory = (searchText) => {
    let savedSearches = JSON.parse(localStorage.getItem('searchHistory')) || [];
    if (!savedSearches.includes(searchText)) {
      savedSearches.push(searchText);
      localStorage.setItem('searchHistory', JSON.stringify(savedSearches));
    }
  };

  const searchPodcast = async () => {
    const searchValue = searchInput.value.trim();
    if (searchValue) {
      saveSearchHistory(searchValue);
      loadSearchHistory();

      showLoader();
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(searchValue)}`
        );
        const data = await response.json();

        cardsContainer.innerText = '';

        const titles = new Set();

        if (data.feeds && data.feeds.length > 0) {
          data.feeds.forEach((podcast, index) => {
            if (podcast.episodeCount > 0 && !titles.has(podcast.title)) {
              titles.add(podcast.title);

              const card = createCard(podcast);
              cardsContainer.appendChild(card);

              if (index > 20) {
                card.querySelector('img').dataset.src =
                  card.querySelector('img').src;
                card.querySelector('img').src = '';
              }
            }

            handleImageLoad(20);
          });
        } else {
          cardsContainer.innerText = 'No podcasts found.';
        }
      } catch (error) {
        console.error('Error fetching API:', error);
        cardsContainer.innerText = `Error: ${error.message}`;
      }
    } else {
      cardsContainer.innerText = 'Please enter a podcast title.';
    }
  };

  const loadEpisodes = async (feedId, count) => {
    if (feedId) {
      showLoader();
      try {
        const response = await fetch(
          `/api/episodes?feedId=${encodeURIComponent(feedId)}&max=${count}`
        );
        const data = await response.json();

        cardsContainer.innerText = '';

        if (data.items && data.items.length > 0) {
          data.items.forEach((episode, index) => {
            const card = createEpisodeCard(episode);
            cardsContainer.appendChild(card);

            if (index > 20) {
              card.querySelector('img').dataset.src =
                card.querySelector('img').src;
              card.querySelector('img').src = '';
            }
          });
        } else {
          cardsContainer.innerText = 'No episones found.';
        }

        handleImageLoad(20);
      } catch (error) {
        console.error('Error fetching API:', error);
        cardsContainer.innerText = `Error: ${error.message}`;
      }
    }
  };

  resetButton.addEventListener('click', () => {
    localStorage.removeItem('searchHistory');
    resetSearchHistory();
    searchInput.value = '';
  });
  searchHistory.addEventListener('change', () => {
    const selectedSearch = searchHistory.value;
    if (selectedSearch) {
      searchInput.value = selectedSearch;
      searchPodcast();
    }
  });
  searchButton.addEventListener('click', searchPodcast);
  searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      searchPodcast();
    }
  });
  searchInput.addEventListener('focus', () => {
    searchInput.value = '';
  });

  loadSearchHistory();

  const searchLink = document.getElementById('search-link');
  const listenLink = document.getElementById('listen-link');
  const searchContainer = document.querySelector('.search-container');
  const mainContainer = document.querySelector('.main-container');
  const playerContainer = document.querySelector('.player-container');

  const navigateToSearch = () => {
    searchContainer.style.display = 'flex';
    mainContainer.style.display = 'flex';
    playerContainer.style.display = 'none';
    queueContainer.style.display = 'none';
    searchLink.classList.add('selected');
    listenLink.classList.remove('selected');
  };

  const navigateToPlayer = () => {
    searchContainer.style.display = 'none';
    mainContainer.style.display = 'none';
    playerContainer.style.display = 'flex';
    queueContainer.style.display = 'flex';
    listenLink.classList.add('selected');
    searchLink.classList.remove('selected');
  };

  searchLink.addEventListener('click', navigateToSearch);
  listenLink.addEventListener('click', navigateToPlayer);

  const image = document.getElementById('image');
  const title = document.getElementById('title');
  const datePublished = document.getElementById('date-published');
  const player = document.getElementById('player');
  const currentTimeEl = document.getElementById('current-time');
  const durationEl = document.getElementById('duration');
  const progress = document.getElementById('progress');
  const progressContainer = document.getElementById('progress-container');
  const prevBtn = document.getElementById('prev');
  const playBtn = document.getElementById('play');
  const nextBtn = document.getElementById('next');

  // Check if Playing
  let isPlaying = false;

  // Play
  const playPodcast = () => {
    isPlaying = true;
    playBtn.classList.replace('fa-play', 'fa-pause');
    playBtn.setAttribute('title', 'Pause');
    player.play();
  };

  // Pause
  const pausePodcast = () => {
    isPlaying = false;
    playBtn.classList.replace('fa-pause', 'fa-play');
    playBtn.setAttribute('title', 'Play');
    player.pause();
  };

  // Play or Pause Event Listener
  playBtn.addEventListener('click', () =>
    isPlaying ? pausePodcast() : playPodcast()
  );

  const formatTime = (time, elName) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    let seconds = Math.floor(time % 60);

    if (seconds < 10) seconds = `0${seconds}`;
    const formattedMinutes =
      hours > 0 && minutes < 10 ? `0${minutes}` : minutes;

    if (time) {
      elName.textContent =
        hours > 0
          ? `${hours}:${formattedMinutes}:${seconds}`
          : `${minutes}:${seconds}`;
    }
  };

  // Update DOM
  const loadPodcast = (episode) => {
    currentTimeEl.display = 'none';
    durationEl.display = 'none';
    title.textContent = episode.title;
    datePublished.textContent = `${
      episode.datePublished
        ? formatDate(episode.datePublished)
        : 'Not available'
    }`;
    player.src = episode.enclosureUrl;
    image.src = episode.image || episode.feedImage || './default-podcast.png';

    player.currentTime = 0;
    progress.classList.add('loading');
    currentTimeEl.textContent = '0:00';

    player.addEventListener('loadedmetadata', () => {
      const duration = player.duration;
      currentTimeEl.display = 'block';
      durationEl.display = 'block';
      formatTime(duration, durationEl);
      progress.classList.remove('loading');
      playPodcast();
    });
  };

  function skipTime(amount) {
    player.currentTime = Math.max(
      0,
      Math.min(player.duration, player.currentTime + amount)
    );
  }

  // Update Progress Bar & Time
  const updateProgressBar = (e) => {
    const { duration, currentTime } = e.srcElement;
    // Update progress bar width
    const progressPercent = (currentTime / duration) * 100;
    progress.style.width = `${progressPercent}%`;
    // Calculate display for duration
    formatTime(duration, durationEl);
    formatTime(currentTime, currentTimeEl);
  };

  // Set Progress Bar
  function setProgressBar(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const { duration } = player;
    player.currentTime = (clickX / width) * duration;
  }

  // Event Listeners
  player.addEventListener('timeupdate', updateProgressBar);
  progressContainer.addEventListener('click', setProgressBar);
  prevBtn.addEventListener('click', () => skipTime(-15));
  nextBtn.addEventListener('click', () => skipTime(30));

  const isMobileDevice = () => window.innerWidth < 1025;

  setInterval(() => {
    if (isPlaying) {
      const playerState = {
        title: title.textContent,
        datePublished: datePublished.textContent,
        currentTime: player.currentTime,
        duration: player.duration,
        image: image.src,
        src: player.src,
      };

      localStorage.setItem('playerState', JSON.stringify(playerState));
    }
  }, 5000);

  const loadPlayerState = () => {
    const savedState = JSON.parse(localStorage.getItem('playerState'));
    if (savedState) {
      title.textContent = savedState.title;
      datePublished.textContent = savedState.datePublished;
      player.currentTime = savedState.currentTime;
      player.duration = savedState.duration;
      image.src = savedState.image;
      player.src = savedState.src;
      formatTime(savedState.currentTime, currentTimeEl);
      formatTime(savedState.duration, durationEl);
      progress.style.width = `${
        (savedState.currentTime / savedState.duration) * 100
      }%`;
      if (isMobileDevice()) navigateToPlayer();
    }
  };

  loadPlayerState();
  loadQueue();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('service-worker.js')
        .then((registration) => {
          console.log('Service Worker register with scope', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed', error);
        });
    });
  }
});
