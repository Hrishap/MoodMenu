const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ImageService {
  constructor() {
    this.unsplashApiKey = process.env.UNSPLASH_ACCESS_KEY;
    this.pexelsApiKey = process.env.PEXELS_API_KEY;
    this.cacheDir = path.join(__dirname, '../cache/images');
    this.ensureCacheDir();
  }

  async ensureCacheDir() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('Error creating cache directory:', error);
    }
  }

  // Main method to get recipe image
  async getRecipeImage(recipeName, category = 'food') {
    try {
      // Try cache first
      const cachedImage = await this.getCachedImage(recipeName);
      if (cachedImage) {
        return cachedImage;
      }

      // Try Unsplash first
      let imageUrl = await this.searchUnsplash(recipeName, category);
      
      // Fallback to Pexels
      if (!imageUrl) {
        imageUrl = await this.searchPexels(recipeName, category);
      }
      
      // Fallback to Foodish API
      if (!imageUrl) {
        imageUrl = await this.getFoodishImage(category);
      }
      
      // Cache the result
      if (imageUrl) {
        await this.cacheImage(recipeName, imageUrl);
      }
      
      return imageUrl || this.getDefaultImage(category);
      
    } catch (error) {
      console.error('Error getting recipe image:', error);
      return this.getDefaultImage(category);
    }
  }

  // Search Unsplash for food images
  async searchUnsplash(recipeName, category) {
    if (!this.unsplashApiKey) {
      console.log('No Unsplash API key provided');
      return null;
    }

    try {
      const searchQuery = `${recipeName} food delicious`;
      const response = await axios.get('https://api.unsplash.com/search/photos', {
        params: {
          query: searchQuery,
          per_page: 5,
          orientation: 'landscape'
        },
        headers: {
          'Authorization': `Client-ID ${this.unsplashApiKey}`
        },
        timeout: 5000
      });

      if (response.data.results && response.data.results.length > 0) {
        const photo = response.data.results[0];
        return photo.urls.regular; // 1080px width
      }
      
      return null;
    } catch (error) {
      console.error('Unsplash API error:', error.message);
      return null;
    }
  }

  // Search Pexels for food images
  async searchPexels(recipeName, category) {
    if (!this.pexelsApiKey) {
      console.log('No Pexels API key provided');
      return null;
    }

    try {
      const searchQuery = `${recipeName} food dish`;
      const response = await axios.get('https://api.pexels.com/v1/search', {
        params: {
          query: searchQuery,
          per_page: 5,
          orientation: 'landscape'
        },
        headers: {
          'Authorization': this.pexelsApiKey
        },
        timeout: 5000
      });

      if (response.data.photos && response.data.photos.length > 0) {
        const photo = response.data.photos[0];
        return photo.src.large; // High quality image
      }
      
      return null;
    } catch (error) {
      console.error('Pexels API error:', error.message);
      return null;
    }
  }

  // Get random food image from Foodish API
  async getFoodishImage(category) {
    try {
      const response = await axios.get('https://foodish-api.herokuapp.com/api/', {
        timeout: 5000
      });

      if (response.data && response.data.image) {
        return response.data.image;
      }
      
      return null;
    } catch (error) {
      console.error('Foodish API error:', error.message);
      return null;
    }
  }

  // Cache image URL
  async cacheImage(recipeName, imageUrl) {
    try {
      const cacheKey = this.generateCacheKey(recipeName);
      const cacheFile = path.join(this.cacheDir, `${cacheKey}.json`);
      
      const cacheData = {
        recipeName,
        imageUrl,
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };

      await fs.writeFile(cacheFile, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching image:', error);
    }
  }

  // Get cached image
  async getCachedImage(recipeName) {
    try {
      const cacheKey = this.generateCacheKey(recipeName);
      const cacheFile = path.join(this.cacheDir, `${cacheKey}.json`);
      
      const cacheData = JSON.parse(await fs.readFile(cacheFile, 'utf8'));
      
      // Check if cache is still valid
      if (Date.now() < cacheData.expiresAt) {
        return cacheData.imageUrl;
      } else {
        // Cache expired, delete file
        await fs.unlink(cacheFile);
        return null;
      }
    } catch (error) {
      // Cache miss or error
      return null;
    }
  }

  // Generate cache key from recipe name
  generateCacheKey(recipeName) {
    return crypto
      .createHash('md5')
      .update(recipeName.toLowerCase().trim())
      .digest('hex');
  }

  // Get default image based on category
  getDefaultImage(category) {
    const defaultImages = {
      comfort: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&h=300&fit=crop',
      quick: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
      healthy: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
      food: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop'
    };
    
    return defaultImages[category] || defaultImages.food;
  }

  // Clear expired cache (reverted to original logic)
  async clearExpiredCache() {
    try {
      const files = await fs.readdir(this.cacheDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.cacheDir, file);
          const cacheData = JSON.parse(await fs.readFile(filePath, 'utf8'));
          if (Date.now() >= cacheData.expiresAt) {
            await fs.unlink(filePath);
          }
        }
      }
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }
}

module.exports = new ImageService();