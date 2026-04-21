/**
 * ImageCache Utility
 * Preloads and manages a set of product images to ensure zero-latency viewing
 * especially on mobile devices with high-latency networks.
 */

class ImageCacheManager {
  constructor() {
    this.cache = new Map();
    this.queue = [];
    this.isProcessing = false;
  }

  /**
   * Preload an array of image URLs
   * @param {string[]} urls 
   */
  preload(urls) {
    if (!urls || !Array.isArray(urls)) return;
    
    // Add unique URLs to queue
    const uniqueUrls = urls.filter(url => url && !this.cache.has(url));
    this.queue.push(...uniqueUrls);
    
    this.processQueue();
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const url = this.queue.shift();
      if (this.cache.has(url)) continue;

      try {
        await this.loadImage(url);
      } catch (err) {
        console.warn(`Failed to preload image: ${url}`, err);
      }
    }

    this.isProcessing = false;
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.cache.set(url, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  get(url) {
    return this.cache.get(url);
  }

  clear() {
    this.cache.clear();
    this.queue = [];
  }
}

const imageCache = new ImageCacheManager();
export default imageCache;
