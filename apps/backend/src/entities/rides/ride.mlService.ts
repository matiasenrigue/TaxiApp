import { getZonesForRide } from './utils/zoneDetector';
import { scoreTripXGB, formatDateTimeForScoring } from '../../shared/utils/dataApiClient';
import { RIDE_CONSTANTS } from './ride.constants';
import { RideCoordinates } from './ride.types';
import { RideValidators } from './ride.validators';
import { redisClient } from '../../shared/config/redis';

/**
 * ML-based ride scoring using zones and time data.
 * Falls back gracefully when ML is unavailable.
 */
export class RideMLService {
    

    /**
     * Score ride using ML and zone detection.
     * @returns Rating (1-5) and zones, or default if ML down
     * @throws If missing coords or can't determine zones
     */
    static async evaluateRideScore(coords: Partial<RideCoordinates>): Promise<{
        rating: number | null;
        zones: {
            originZone: string | null;
            destinationZone: string | null;
        };
    }> {

        if (!coords.startLat || !coords.startLng || !coords.destLat || !coords.destLng) {
            throw new Error('Missing required coordinates for evaluation');
        }

        const zones = getZonesForRide(
            coords.startLat, 
            coords.startLng, 
            coords.destLat, 
            coords.destLng
        );
        
        if (!zones.originZone || !zones.destinationZone) {
            throw new Error('Could not determine zones for coordinates');
        }
        
        try {
            // Cache key based on zones and hour of day (predictions vary by time)
            const hourOfDay = new Date().getHours();
            const cacheKey = `ml:prediction:${zones.originZone}:${zones.destinationZone}:${hourOfDay}`;
            
            // Check cache first
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                const rating = parseInt(cached);
                console.log(`INFO: ML Cache HIT - Route: ${zones.originZone} → ${zones.destinationZone}, Hour: ${hourOfDay}, Rating: ${rating}`);
                return { rating, zones };
            }
            
            const scoreResult = await scoreTripXGB({
                pickup_zone: zones.originZone,
                dropoff_zone: zones.destinationZone,
                pickup_datetime: formatDateTimeForScoring(new Date())
            });
            
            // Validate and convert score
            const prediction = scoreResult.final_score;

            RideValidators.validatePredictionScore(prediction);
            
            const rating = this.convertPredictionToRating(prediction);

            // Cache for 1 hour (predictions change by hour)
            await redisClient.setEx(cacheKey, 3600, rating.toString());
            console.log(`INFO: ML Cache MISS - Route: ${zones.originZone} → ${zones.destinationZone}, Hour: ${hourOfDay}, New Rating: ${rating} (cached for 1h)`);

            return { rating, zones };
            
        } catch (error) {
            console.error('ML scoring error:', error);
            return { 
                rating: RIDE_CONSTANTS.DEFAULT_RATING, 
                zones 
            };
        }
    }
    
    /**
     * Convert ML score (0-1) to user rating (1-5).
     * Maps: 0->1, 0.25->2, 0.5->3, 0.75->4, 1->5
     */
    private static convertPredictionToRating(prediction: number): number {
        const rating = Math.round(1 + (prediction * 4));
        return Math.max(
            RIDE_CONSTANTS.PREDICTION_SCALE.RATING_MIN,
            Math.min(RIDE_CONSTANTS.PREDICTION_SCALE.RATING_MAX, rating)
        );
    }
    
    /**
     * Simple interface for ride evaluation.
     * @returns Rating (1-5) or null
     */
    static async evaluateRide(startLat: number, startLng: number, destLat: number, destLng: number): Promise<number | null> {

        RideValidators.validateCoordinates({ startLat, startLng, destLat, destLng });
        
        const evaluation = await this.evaluateRideScore({ 
            startLat, 
            startLng, 
            destLat, 
            destLng 
        });
        
        return evaluation.rating;
    }
}