/* eslint-disable no-restricted-globals */
/* eslint-disable no-bitwise */
/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */

const GEOHASH_PRECISION = 10;

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

const EARTH_MERI_CIRCUMFERENCE = 40007860;

const METERS_PER_DEGREE_LATITUDE = 110574;

const BITS_PER_CHAR = 5;

const MAXIMUM_BITS_PRECISION = 22 * BITS_PER_CHAR;

const EARTH_EQ_RADIUS = 6378137.0;

const E2 = 0.00669447819799;

const EPSILON = 1e-12;

function log2(x) {
  return Math.log(x) / Math.log(2);
}

function degreesToRadians(degrees) {
  if (typeof degrees !== 'number' || isNaN(degrees)) {
    throw new Error('Error: degrees must be a number');
  }

  return (degrees * Math.PI) / 180;
}

function encodeGeohash(location, precision = GEOHASH_PRECISION) {
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
    const val = even ? location[1] : location[0];
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

function metersToLongitudeDegrees(distance, latitude) {
  const radians = degreesToRadians(latitude);
  const num = (Math.cos(radians) * EARTH_EQ_RADIUS * Math.PI) / 180;
  const denom = 1 / Math.sqrt(1 - E2 * Math.sin(radians) * Math.sin(radians));
  const deltaDeg = num * denom;
  if (deltaDeg < EPSILON) {
    return distance > 0 ? 360 : 0;
  }
  return Math.min(360, distance / deltaDeg);
}

function longitudeBitsForResolution(resolution, latitude) {
  const degs = metersToLongitudeDegrees(resolution, latitude);
  return Math.abs(degs) > 0.000001 ? Math.max(1, log2(360 / degs)) : 1;
}

function latitudeBitsForResolution(resolution) {
  return Math.min(
    log2(EARTH_MERI_CIRCUMFERENCE / 2 / resolution),
    MAXIMUM_BITS_PRECISION,
  );
}

function wrapLongitude(longitude) {
  if (longitude <= 180 && longitude >= -180) {
    return longitude;
  }
  const adjusted = longitude + 180;
  if (adjusted > 0) {
    return (adjusted % 360) - 180;
  }
  return 180 - (-adjusted % 360);
}

function boundingBoxBits(coordinate, size) {
  const latDeltaDegrees = size / METERS_PER_DEGREE_LATITUDE;
  const latitudeNorth = Math.min(90, coordinate[0] + latDeltaDegrees);
  const latitudeSouth = Math.max(-90, coordinate[0] - latDeltaDegrees);
  const bitsLat = Math.floor(latitudeBitsForResolution(size)) * 2;
  const bitsLongNorth = Math.floor(longitudeBitsForResolution(size, latitudeNorth)) * 2 - 1;
  const bitsLongSouth = Math.floor(longitudeBitsForResolution(size, latitudeSouth)) * 2 - 1;
  return Math.min(
    bitsLat,
    bitsLongNorth,
    bitsLongSouth,
    MAXIMUM_BITS_PRECISION,
  );
}

function boundingBoxCoordinates(center, radius) {
  const latDegrees = radius / METERS_PER_DEGREE_LATITUDE;
  const latitudeNorth = Math.min(90, center[0] + latDegrees);
  const latitudeSouth = Math.max(-90, center[0] - latDegrees);
  const longDegsNorth = metersToLongitudeDegrees(radius, latitudeNorth);
  const longDegsSouth = metersToLongitudeDegrees(radius, latitudeSouth);
  const longDegs = Math.max(longDegsNorth, longDegsSouth);
  return [
    [center[0], center[1]],
    [center[0], wrapLongitude(center[1] - longDegs)],
    [center[0], wrapLongitude(center[1] + longDegs)],
    [latitudeNorth, center[1]],
    [latitudeNorth, wrapLongitude(center[1] - longDegs)],
    [latitudeNorth, wrapLongitude(center[1] + longDegs)],
    [latitudeSouth, center[1]],
    [latitudeSouth, wrapLongitude(center[1] - longDegs)],
    [latitudeSouth, wrapLongitude(center[1] + longDegs)],
  ];
}

function geohashQuery(geohash, bits) {
  const precision = Math.ceil(bits / BITS_PER_CHAR);
  if (geohash.length < precision) {
    return [geohash, `${geohash}~`];
  }
  geohash = geohash.substring(0, precision);
  const base = geohash.substring(0, geohash.length - 1);
  const lastValue = BASE32.indexOf(geohash.charAt(geohash.length - 1));
  const significantBits = bits - base.length * BITS_PER_CHAR;
  const unusedBits = BITS_PER_CHAR - significantBits;
  const startValue = (lastValue >> unusedBits) << unusedBits;
  const endValue = startValue + (1 << unusedBits);

  if (endValue > 31) {
    return [base + BASE32[startValue], `${base}~`];
  }
  return [base + BASE32[startValue], base + BASE32[endValue]];
}

function geohashQueries(center, radius) {
  const queryBits = Math.max(1, boundingBoxBits(center, radius));
  const geohashPrecision = Math.ceil(queryBits / BITS_PER_CHAR);
  const coordinates = boundingBoxCoordinates(center, radius);
  const queries = coordinates.map(
    (coordinate) => geohashQuery(
      encodeGeohash(coordinate, geohashPrecision), queryBits,
    ),
  );

  return queries.filter((query, index) => !queries.some((other, otherIndex) => (
    index > otherIndex && query[0] === other[0] && query[1] === other[1]
  )));
}

export default geohashQueries;
