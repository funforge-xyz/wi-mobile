
// Geohash utility functions for location-based queries
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
const GEOHASH_PRECISION = 7;

export function encodeGeohash(coordinates: { latitude: number; longitude: number }, precision: number = GEOHASH_PRECISION): string {
  if (typeof precision !== 'undefined') {
    if (typeof precision !== 'number' || isNaN(precision)) {
      throw new Error('precision must be a number');
    } else if (precision <= 0) {
      throw new Error('precision must be greater than 0');
    } else if (precision > 22) {
      throw new Error('precision cannot be greater than 22');
    } else if (Math.round(precision) !== precision) {
      throw new Error('precision must be an integer');
    }
  }

  const latitudeRange = {
    min: -90,
    max: 90,
  };
  const longitudeRange = {
    min: -180,
    max: 180,
  };
  let hash = '';
  let hashVal = 0;
  let bits = 0;
  let even = 1;

  while (hash.length < precision) {
    const val = even ? coordinates.longitude : coordinates.latitude;
    const range = even ? longitudeRange : latitudeRange;
    const mid = (range.min + range.max) / 2;

    if (val > mid) {
      hashVal = (hashVal << 1) + 1;
      range.min = mid;
    } else {
      hashVal = (hashVal << 1) + 0;
      range.max = mid;
    }

    even = !even;
    if (bits < 4) {
      bits++;
    } else {
      bits = 0;
      hash += BASE32[hashVal];
      hashVal = 0;
    }
  }

  return hash;
}

export function decodeGeohash(geohash: string): { latitude: number; longitude: number; latitudeError: number; longitudeError: number } {
  const latitudeRange = { min: -90, max: 90 };
  const longitudeRange = { min: -180, max: 180 };
  let even = 1;

  for (let i = 0; i < geohash.length; i++) {
    const char = geohash[i];
    const cd = BASE32.indexOf(char);
    
    if (cd === -1) {
      throw new Error('Invalid geohash character: ' + char);
    }

    for (let mask = 16; mask >= 1; mask >>>= 1) {
      const range = even ? longitudeRange : latitudeRange;
      const mid = (range.min + range.max) / 2;

      if (cd & mask) {
        range.min = mid;
      } else {
        range.max = mid;
      }

      even = !even;
    }
  }

  const latitude = (latitudeRange.min + latitudeRange.max) / 2;
  const longitude = (longitudeRange.min + longitudeRange.max) / 2;
  const latitudeError = latitudeRange.max - latitude;
  const longitudeError = longitudeRange.max - longitude;

  return { latitude, longitude, latitudeError, longitudeError };
}

export function getGeohashNeighbors(geohash: string): string[] {
  const neighbors = [];
  const decoded = decodeGeohash(geohash);
  const precision = geohash.length;
  
  // Generate neighboring geohashes
  const latOffset = decoded.latitudeError * 2;
  const lngOffset = decoded.longitudeError * 2;
  
  const directions = [
    { lat: 0, lng: lngOffset },     // East
    { lat: 0, lng: -lngOffset },    // West
    { lat: latOffset, lng: 0 },     // North
    { lat: -latOffset, lng: 0 },    // South
    { lat: latOffset, lng: lngOffset },   // Northeast
    { lat: latOffset, lng: -lngOffset },  // Northwest
    { lat: -latOffset, lng: lngOffset },  // Southeast
    { lat: -latOffset, lng: -lngOffset }, // Southwest
  ];
  
  for (const direction of directions) {
    try {
      const neighborHash = encodeGeohash({
        latitude: decoded.latitude + direction.lat,
        longitude: decoded.longitude + direction.lng
      }, precision);
      neighbors.push(neighborHash);
    } catch (error) {
      // Skip invalid coordinates
    }
  }
  
  return neighbors;
}
