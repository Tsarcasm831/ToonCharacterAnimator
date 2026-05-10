import { ITEM_IMAGES } from '../data/constants';

// Land images from LandSelectionModal
const LAND_IMAGES: Record<string, string> = {
  Land01: '/assets/images/lands/Fire.jpg',
  Land02: '/assets/images/lands/Hotsprings.jpg',
  Land03: '/assets/images/lands/Frost.jpg',
  Land05: '/assets/images/lands/Woods.jpg',
  Land06: '/assets/images/lands/Tea.jpg',
  Land07: '/assets/images/lands/Rivers.jpg',
  Land08: '/assets/images/lands/RicePaddies.jpg',
  Land09: '/assets/images/lands/Waterfalls.jpg',
  Land11: '/assets/images/lands/Birds.jpg',
  Land12: '/assets/images/lands/Earth.jpg',
  Land13: '/assets/images/lands/Cloud.jpg',
  Land15: '/assets/images/lands/Wind.jpg',
  Land16: '/assets/images/lands/Rain.jpg',
  Land17: '/assets/images/lands/Grass.jpg',
  Land22: '/assets/images/lands/Water.jpg',
  Land23: '/assets/images/lands/Ghosts.jpg',
  Land25: '/assets/images/lands/NagaIsland.jpg'
};

// Video assets from MenuBackground
const VIDEO_ASSETS = [
  '/assets/videos/game/compressed_game_loading_1.mp4',
  '/assets/videos/game/compressed_game_loading_2.mp4',
  '/assets/videos/game/compressed_game_loading_3.mp4'
];

/**
 * Precache a single image using fetch to ensure it's in browser cache
 */
async function precacheImage(src: string): Promise<void> {
  try {
    // Use fetch with cache mode to ensure the image is stored in browser cache
    const response = await fetch(src, { 
      method: 'GET',
      cache: 'force-cache',
      mode: 'no-cors'
    });
    if (response.ok || response.type === 'opaque') {
      // Also load via Image object for browser image cache
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Resolve anyway
        img.src = src;
      });
    }
  } catch (e) {
    // Fallback: try Image object only
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => {
        console.warn(`[ImageCache] Failed to cache: ${src}`);
        resolve();
      };
      img.src = src;
    });
  }
}

/**
 * Precache a video by preloading it
 */
function precacheVideo(src: string): Promise<void> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    
    // Resolve on canplaythrough or after timeout
    const timeout = setTimeout(() => resolve(), 5000);
    
    video.addEventListener('canplaythrough', () => {
      clearTimeout(timeout);
      resolve();
    }, { once: true });
    
    video.addEventListener('error', () => {
      clearTimeout(timeout);
      console.warn(`[ImageCache] Failed to cache video: ${src}`);
      resolve(); // Resolve anyway to not block
    }, { once: true });
    
    video.src = src;
    video.load();
  });
}

/**
 * Get all image URLs that need to be cached
 */
function getAllImageUrls(): string[] {
  const images = new Set<string>();
  
  // Add ITEM_IMAGES (inventory item images)
  const itemImageUrls = Object.values(ITEM_IMAGES);
  console.log(`[ImageCache] Found ${itemImageUrls.length} inventory item images:`, itemImageUrls);
  itemImageUrls.forEach(url => images.add(url));
  
  // Add LAND_IMAGES
  Object.values(LAND_IMAGES).forEach(url => images.add(url));
  
  return Array.from(images);
}

/**
 * Precache all images and videos on first load.
 * Returns a promise that resolves when initial batch is loaded.
 */
export async function precacheAllAssets(onProgress?: (loaded: number, total: number) => void): Promise<void> {
  const imageUrls = getAllImageUrls();
  const totalAssets = imageUrls.length + VIDEO_ASSETS.length;
  let loadedCount = 0;
  
  console.log(`[ImageCache] Starting precache of ${totalAssets} assets...`);
  
  // Process images in batches to not overwhelm the browser
  const batchSize = 5;
  
  for (let i = 0; i < imageUrls.length; i += batchSize) {
    const batch = imageUrls.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (url) => {
        await precacheImage(url);
        loadedCount++;
        onProgress?.(loadedCount, totalAssets);
      })
    );
  }
  
  // Cache videos in parallel (lower priority)
  await Promise.all(
    VIDEO_ASSETS.map(async (url) => {
      await precacheVideo(url);
      loadedCount++;
      onProgress?.(loadedCount, totalAssets);
    })
  );
  
  console.log(`[ImageCache] Precache complete. ${loadedCount}/${totalAssets} assets loaded.`);
}

/**
 * Check if assets have been precached in this session
 */
export function hasPrecachedThisSession(): boolean {
  return sessionStorage.getItem('tca_assets_precached') === 'true';
}

/**
 * Mark assets as precached for this session
 */
export function markPrecachedThisSession(): void {
  sessionStorage.setItem('tca_assets_precached', 'true');
}
