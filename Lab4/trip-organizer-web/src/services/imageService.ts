// Predefined image URLs for common destinations
const DESTINATION_IMAGES: { [key: string]: string } = {
    // Major cities
    'warsaw': 'https://images.pexels.com/photos/1796730/pexels-photo-1796730.jpeg',
    'paris': 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg',
    'tokyo': 'https://images.pexels.com/photos/1488327/pexels-photo-1488327.jpeg',
    'london': 'https://images.pexels.com/photos/460621/pexels-photo-460621.jpeg',
    'new york': 'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg',
    'rome': 'https://images.pexels.com/photos/1796731/pexels-photo-1796731.jpeg',
    'barcelona': 'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg',
    'amsterdam': 'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg',
    'berlin': 'https://images.pexels.com/photos/1964471/pexels-photo-1964471.jpeg',
    'prague': 'https://images.pexels.com/photos/1118873/pexels-photo-1118873.jpeg',
    
    // Default image if destination not found
    'default': 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg'
};

export const imageService = {
    getDestinationImage: (destination: string): string => {
        // Convert destination to lowercase for matching
        const dest = destination.toLowerCase().trim();
        
        // Try to find an exact match
        if (DESTINATION_IMAGES[dest]) {
            return DESTINATION_IMAGES[dest];
        }
        
        // Try to find a partial match
        for (const [key, url] of Object.entries(DESTINATION_IMAGES)) {
            if (dest.includes(key) || key.includes(dest)) {
                return url;
            }
        }
        
        // Return default image if no match found
        return DESTINATION_IMAGES.default;
    },

    getTripImage: (tripName: string, destination: string): string => {
        return imageService.getDestinationImage(destination);
    }
}; 