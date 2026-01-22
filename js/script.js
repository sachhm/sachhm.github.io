document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("globe-container");
  const locationEl = document.getElementById("location");
  if (!container) return;

  // Wireframe globe - dark with glowing outlines
  const globe = Globe()
    .backgroundColor("rgba(0,0,0,0)")
    .showGlobe(true)
    .globeImageUrl("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%23080810' width='1' height='1'/%3E%3C/svg%3E")
    .showAtmosphere(false)
    .polygonCapColor(() => "rgba(0, 20, 40, 0.8)")
    .polygonSideColor(() => "rgba(0, 50, 80, 0.5)")
    .polygonStrokeColor(() => "#4db8ff")
    .polygonAltitude(0.01)
    .pointsData([])
    .pointColor(() => "#4db8ff")
    .pointAltitude(0.02)
    .pointRadius(0.6)
    (container);

  // Set size
  globe.width(container.offsetWidth);
  globe.height(container.offsetHeight);

  // Auto-rotate
  globe.controls().autoRotate = true;
  globe.controls().autoRotateSpeed = 0.5;

  // Handle resize
  window.addEventListener("resize", function () {
    globe.width(container.offsetWidth);
    globe.height(container.offsetHeight);
  });

  // Load country polygons
  fetch("https://unpkg.com/world-atlas@2/countries-110m.json")
    .then((res) => res.json())
    .then((worldData) => {
      const countries = topojson.feature(worldData, worldData.objects.countries);
      globe.polygonsData(countries.features);
    });

  // Fetch visitor location
  fetch("https://get.geojs.io/v1/ip/geo.json")
    .then((res) => res.json())
    .then((data) => {
      if (data.latitude && data.longitude) {
        // Update greeting
        const place = data.city || data.country || "Earth";
        const lat = parseFloat(data.latitude);
        const lng = parseFloat(data.longitude);
        if (locationEl) locationEl.textContent = place;

        // Add marker
        globe.pointsData([{ lat: lat, lng: lng }]);

        // Fly to location
        globe.pointOfView({ lat: lat, lng: lng, altitude: 2 }, 2000);

        // Stop rotation after animation
        setTimeout(() => {
          globe.controls().autoRotate = false;
        }, 2000);
      }
    })
    .catch(() => {
      // Keep default "Earth" on error
    });
});
