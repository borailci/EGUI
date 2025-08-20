import { DESTINATION_IMAGES } from '../constants/images';

export const imageService = {
    getDestinationImage: (destination: string): string => {
        if (!destination) {
            return DESTINATION_IMAGES['default'];
        }

        // Normalize the destination string
        const normalizedDestination = destination.toLowerCase().trim();
        
        // Try exact match first
        if (DESTINATION_IMAGES[normalizedDestination]) {
            return DESTINATION_IMAGES[normalizedDestination];
        }
        
        // Try partial matches
        const partialMatches = Object.keys(DESTINATION_IMAGES).filter(key => {
            // Skip the default key
            if (key === 'default') return false;
            
            // Check if the destination contains the key or vice versa
            return normalizedDestination.includes(key) || key.includes(normalizedDestination);
        });

        if (partialMatches.length > 0) {
            // Return the first partial match
            return DESTINATION_IMAGES[partialMatches[0]];
            }

        // If no matches found, try to categorize the destination
        const categories = {
            beach: ['beach', 'coast', 'shore', 'seaside', 'ocean', 'sea'],
            mountain: ['mountain', 'hill', 'peak', 'alps', 'range'],
            city: ['city', 'town', 'metropolitan', 'urban'],
            desert: ['desert', 'sahara', 'dunes'],
            forest: ['forest', 'woods', 'jungle', 'rainforest'],
            lake: ['lake', 'river', 'waterfall', 'stream']
        };

        // Check if the destination contains any category keywords
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => normalizedDestination.includes(keyword))) {
                // Return a default image for that category
                switch (category) {
                    case 'beach':
                        return DESTINATION_IMAGES['bali'];
                    case 'mountain':
                        return DESTINATION_IMAGES['swiss alps'];
                    case 'city':
                        return DESTINATION_IMAGES['warsaw'];
                    case 'desert':
                        return DESTINATION_IMAGES['dubai'];
                    case 'forest':
                        return DESTINATION_IMAGES['bali'];
                    case 'lake':
                        return DESTINATION_IMAGES['bali'];
                    default:
                        return DESTINATION_IMAGES['default'];
                }
            }
        }

        // If all else fails, return the default image
        return DESTINATION_IMAGES['default'];
    },

    getTripImage: (_: string, destination: string): string => {
        return imageService.getDestinationImage(destination);
    }
}; 