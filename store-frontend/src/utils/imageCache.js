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

    const schedule = (fn) => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(fn, { timeout: 200 });
      } else {
        setTimeout(fn, 50);
      }
    };

    const processNext = () => {
      if (this.queue.length === 0) {
        this.isProcessing = false;
        return;
      }

      const url = this.queue.shift();
      if (this.cache.has(url)) {
        schedule(processNext);
        return;
      }

      // Load image without blocking main thread; don't await serially
      const img = new Image();
      img.loading = 'lazy';
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try { this.cache.set(url, img); } catch (e) {}
        schedule(processNext);
      };
      img.onerror = () => {
        console.warn(`Failed to preload image: ${url}`);
        schedule(processNext);
      };
      img.src = url;
    };

    // Start processing using idle time
    schedule(processNext);
  }

  // Legacy API preserved (returns quickly, actual loading is throttled)
  loadImage(url) {
    try {
      const img = new Image();
      img.loading = 'lazy';
      img.crossOrigin = 'anonymous';
      img.src = url;
      this.cache.set(url, img);
      return Promise.resolve(img);
    } catch (err) {
      return Promise.reject(err);
    }
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
