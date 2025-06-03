const R = 6371;

const rad2deg = (radians) => radians * (180 / Math.PI);
const deg2rad = (degrees) => degrees * (Math.PI / 180);

const getBoundingBox = (lat, lon, radius) => {
  const maxLat = lat + rad2deg(radius / R);
  const minLat = lat - rad2deg(radius / R);
  const maxLon = lon + rad2deg(Math.asin(radius / R) / Math.cos(deg2rad(lat)));
  const minLon = lon - rad2deg(Math.asin(radius / R) / Math.cos(deg2rad(lat)));

  return {
    latitudesBox: [minLat, maxLat],
    longitudesBox: [minLon, maxLon],
  };
};

// eslint-disable-next-line import/prefer-default-export
export { getBoundingBox };
