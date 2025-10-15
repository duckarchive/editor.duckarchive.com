// this function checks if the url is a valid google maps or openstreetmap link and extracts coordinates from it
export const parseMapLinkUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url.trim());
    let lat: number | undefined;
    let lng: number | undefined;

    if (parsedUrl.hostname.includes("google.com")) {
      // Google Maps URL formats:
      // https://www.google.com/maps/@37.4219999,-122.0840575,15z
      // https://www.google.com/maps/place/PLACE_DATA/@50.1852305,27.5629519,13z
      // https://www.google.com/maps/place/37°25'19.2"N+122°05'02.6"W/
      const pathMatch = parsedUrl.pathname.match(/@([-.\d]+),([-.\d]+)/);
      if (pathMatch) {
        lat = parseFloat(pathMatch[1]);
        lng = parseFloat(pathMatch[2]);
      } else {
        const placeMatch = parsedUrl.pathname.match(/place\/([-.\d]+)[°\s]*([NS])\s*([-.\d]+)[°\s]*([EW])/);
        if (placeMatch) {
          lat = parseFloat(placeMatch[1]) * (placeMatch[2] === "N" ? 1 : -1);
          lng = parseFloat(placeMatch[3]) * (placeMatch[4] === "E" ? 1 : -1);
        }
      }
    } else if (parsedUrl.hostname.includes("openstreetmap.org")) {
      // OpenStreetMap URL format:
      // https://www.openstreetmap.org/?mlat=37.4219999&mlon=-122.0840575#map=15/37.4219999/-122.0840575
      const latParam = parsedUrl.searchParams.get("mlat");
      const lonParam = parsedUrl.searchParams.get("mlon");
      if (latParam && lonParam) {
        lat = parseFloat(latParam);
        lng = parseFloat(lonParam);
      } else {
        const hashMatch = parsedUrl.hash.match(/#map=\d+\/([-.\d]+)\/([-.\d]+)/);
        if (hashMatch) {
          lat = parseFloat(hashMatch[1]);
          lng = parseFloat(hashMatch[2]);
        }
      }
    } else if (parsedUrl.hostname.includes("toolforge.org")) {
      // https://geohack.toolforge.org/geohack.php?language=uk&pagename=%D0%9F%D0%BE%D0%BD%D1%96%D0%BD%D0%BA%D0%B0&params=50_11_7_N_27_33_49_E_scale:30000
      const params = parsedUrl.searchParams.get("params");
      if (params) {
        const match = params.match(/(\d+)_(\d+)_(\d+)_([NS])_(\d+)_(\d+)_(\d+)_?([EW])/);
        console.log("Toolforge match:", params, match);
        if (match) {
          const latDeg = parseFloat(match[1]);
          const latMin = parseFloat(match[2]);
          const latSec = parseFloat(match[3]);
          const latDir = match[4];
          const lonDeg = parseFloat(match[5]);
          const lonMin = parseFloat(match[6]);
          const lonSec = parseFloat(match[7]);
          const lonDir = match[8];
          lat = latDeg + latMin / 60 + latSec / 3600;
          if (latDir === "S") lat = -lat;
          lng = lonDeg + lonMin / 60 + lonSec / 3600;
          if (lonDir === "W") lng = -lng;
        }
      }
    }

    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
    return null;
  } catch(err) {
    console.error("Failed to parse map link URL:", err);
    return null;
  }
};

export const parseDate = (dateString: string): { start_year: number | null; end_year: number | null } => {
  if (!dateString) {
    return { start_year: null, end_year: null };
  }

  // Remove any non-numeric characters except for hyphens and spaces
  const cleanedString = dateString.replace(/[^\d\s-]/g, '').trim();

  // Case 1: Range of years (e.g., "1941-1945", "1941 - 1945")
  const rangeMatch = cleanedString.match(/^(\d{4})\s*-\s*(\d{4})$/);
  if (rangeMatch) {
    return {
      start_year: parseInt(rangeMatch[1], 10),
      end_year: parseInt(rangeMatch[2], 10),
    };
  }

  // Case 2: Single year (e.g., "1941")
  const singleYearMatch = cleanedString.match(/^(\d{4})$/);
  if (singleYearMatch) {
    const year = parseInt(singleYearMatch[1], 10);
    return { start_year: year, end_year: year };
  }

  // Case 3: List of years (e.g., "1941, 1943, 1945") - take min and max
  const yearList = cleanedString.split(/[\s,]+/).map(s => parseInt(s, 10)).filter(y => !isNaN(y) && y > 1000 && y < 3000);
  if (yearList.length > 1) {
    return {
      start_year: Math.min(...yearList),
      end_year: Math.max(...yearList),
    };
  }
  
  // If no specific format is matched, try to find all 4-digit numbers and take min/max
  const allYears = (dateString.match(/\d{4}/g) || []).map(y => parseInt(y, 10));
  if (allYears.length > 0) {
    const validYears = allYears.filter(y => y > 1000 && y < 3000);
    if (validYears.length > 0) {
      return {
        start_year: Math.min(...validYears),
        end_year: Math.max(...validYears),
      };
    }
  }

  return { start_year: null, end_year: null };
};