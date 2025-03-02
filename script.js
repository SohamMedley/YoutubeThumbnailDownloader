document.addEventListener("DOMContentLoaded", function () {
  function extractVideoId(url) {
    const patterns = [
      /(?:v=|\/)([0-9A-Za-z_-]{11})\b/, 
      /(?:embed\/)([0-9A-Za-z_-]{11})/, 
      /(?:youtu\.be\/)([0-9A-Za-z_-]{11})/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  function getThumbnailUrls(videoId) {
    return {
      max: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      hq: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      mq: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      sd: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
      default: `https://img.youtube.com/vi/${videoId}/default.jpg`
    };
  }

  async function checkImageExists(url) {
    try {
      const response = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async function handleSearch() {
    const input = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('results');
    const url = input.value.trim();

    if (!url) {
      alert('Please enter a YouTube video URL');
      return;
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      alert('Invalid YouTube URL. Please check and try again.');
      return;
    }

    resultsContainer.innerHTML = '<p>Loading thumbnails...</p>';
    input.disabled = true;

    const thumbnails = getThumbnailUrls(videoId);
    const qualityOrder = ["max", "hq", "mq", "sd", "default"];
    const checkResults = await Promise.all(qualityOrder.map(q => checkImageExists(thumbnails[q])));
    const availableThumbnails = qualityOrder
      .filter((q, i) => checkResults[i])
      .reduce((acc, q) => ({ ...acc, [q]: thumbnails[q] }), {});

    input.disabled = false;

    if (Object.keys(availableThumbnails).length === 0) {
      resultsContainer.innerHTML = '<p>No thumbnails found for this video.</p>';
      return;
    }

    // Use the highest quality available based on the qualityOrder.
    const bestQuality = Object.keys(availableThumbnails)[0];

    let thumbnailHtml = `<div class="thumbnail-card">`;
    thumbnailHtml += `<img src="${availableThumbnails[bestQuality]}" alt="YouTube Thumbnail">`;
    thumbnailHtml += `<div class="download-options">`;
    thumbnailHtml += `<button class="download-btn" onclick="downloadImage('${availableThumbnails[bestQuality]}', 'thumbnail-${bestQuality}.jpg')">Download Best Available Thumbnail</button>`;
    thumbnailHtml += `</div></div>`;
    resultsContainer.innerHTML = thumbnailHtml;
  }

  function downloadImage(url, filename) {
    fetch(url, { mode: 'cors' })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok.');
        }
        return response.blob();
      })
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      })
      .catch(error => {
        console.error('Error downloading image:', error);
        alert('Download failed! Try right-clicking and saving the image manually.');
      });
  }

  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  });

  window.handleSearch = handleSearch;
  window.downloadImage = downloadImage;
});
