'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { formatRWF } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Car, AlertTriangle, Layers, Navigation, X, Star, MapPin, Clock, Zap, Plus, Crosshair, Volume2, VolumeX, Search, ChevronRight, Satellite } from 'lucide-react';
import { useLocationAwareness, type POIPreferences } from './useLocationAwareness';
import { POIOverlay } from './POIOverlay';
import { POISettingsPanel } from './POISettingsPanel';

type GpsStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'unavailable';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MapCar {
  id: string;
  make: string;
  model: string;
  year: number;
  type: string;
  pricePerDay: number;
  photos: string[];
  district: string;
  lat: number;
  lng: number;
  rating: number;
  totalTrips: number;
  instantBooking: boolean;
  host: { name: string; avatar: string | null };
}

interface MapReport {
  id: string;
  type: 'TRAFFIC' | 'ACCIDENT' | 'POLICE' | 'ROADBLOCK' | 'FLOOD' | 'POTHOLE';
  lat: number;
  lng: number;
  message?: string;
  upvotes: number;
  expiresAt: string;
}

interface RouteResult {
  route: any; // GeoJSON
  distanceKm: string;
  durationMin: number;
  warnings: { type: string; message: string; lat: number; lng: number }[];
}

interface MapLayers {
  cars: boolean;
  reports: boolean;
  heatmap: boolean;
  route: boolean;
}

const REPORT_ICONS: Record<string, { emoji: string; color: string; label: string }> = {
  TRAFFIC:   { emoji: '🚦', color: '#f59e0b', label: 'Traffic' },
  ACCIDENT:  { emoji: '🚨', color: '#ef4444', label: 'Accident' },
  POLICE:    { emoji: '👮', color: '#3b82f6', label: 'Police' },
  ROADBLOCK: { emoji: '🚧', color: '#f97316', label: 'Roadblock' },
  FLOOD:     { emoji: '🌊', color: '#0ea5e9', label: 'Flooding' },
  POTHOLE:   { emoji: '⚠️', color: '#8b5cf6', label: 'Pothole' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function MobilityMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const carLayerRef = useRef<any>(null);
  const reportLayerRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastFetchCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const isCenteredRef = useRef(false);
  const sseStreamCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  const tileLayerRef = useRef<any>(null);
  const satelliteTileRef = useRef<any>(null);

  const [cars, setCars] = useState<MapCar[]>([]);
  const [reports, setReports] = useState<MapReport[]>([]);
  const [selectedCar, setSelectedCar] = useState<MapCar | null>(null);
  const [layers, setLayers] = useState<MapLayers>({ cars: true, reports: true, heatmap: false, route: false });
  const [showLayers, setShowLayers] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCoords, setReportCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [routeDestName, setRouteDestName] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: -1.9441, lng: 30.0619 });
  const [isLoading, setIsLoading] = useState(true);
  const [satelliteMode, setSatelliteMode] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [directionsQuery, setDirectionsQuery] = useState('');
  const [geocodeResults, setGeoResults] = useState<{ lat: number; lng: number; name: string }[]>([]);
  const [routeSteps, setRouteSteps] = useState<{ instruction: string; distance: number; duration: number }[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationDeniedDismissed, setLocationDeniedDismissed] = useState(false);
  const geocodeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Live Location Awareness state ──────────────────────────────────────────
  const [heading, setHeading] = useState(NaN);
  const [showPOISettings, setShowPOISettings] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [preferences, setPreferences] = useState<POIPreferences>({
    audioEnabled: false,
    categories: ['food', 'landmark', 'healthcare'],
    frequency: 'medium',
    radius: 150,
  });

  const orientationHandlerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);

  // ─── Load Leaflet and initialize map ────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || mapInstanceRef.current) return;

    (async () => {
      const L = (await import('leaflet')).default;

      // Load Leaflet CSS
      if (!document.querySelector('#leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Load MarkerCluster CSS
      if (!document.querySelector('#mc-css')) {
        const link = document.createElement('link');
        link.id = 'mc-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
        document.head.appendChild(link);
        const link2 = document.createElement('link');
        link2.rel = 'stylesheet';
        link2.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
        document.head.appendChild(link2);
      }

      // Initialize map immediately at Kigali default — GPS updates it live
      const defaultLat = -1.9441, defaultLng = 30.0619;

      const map = L.map(mapRef.current!, {
        center: [defaultLat, defaultLng],
        zoom: 13,
        zoomControl: false,
      });

      // OSM tiles
      tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Zoom control bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Layer groups
      carLayerRef.current   = L.layerGroup().addTo(map);
      reportLayerRef.current = L.layerGroup().addTo(map);
      routeLayerRef.current  = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Map click sets report coords
      map.on('click', (e: any) => {
        setReportCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      setIsLoading(false);

      // ── GPS: start watchPosition ───────────────────────────────────────────
      if (!navigator.geolocation) {
        setGpsStatus('unavailable');
        return;
      }

      setGpsStatus('requesting');

      const pulseIcon = (accuracy: number) => L.divIcon({
        html: `<div style="position:relative;width:22px;height:22px;">
          <div style="position:absolute;inset:0;background:#1a7a4a;border-radius:50%;opacity:0.25;animation:gpsPulse 1.8s ease-out infinite;"></div>
          <div style="position:absolute;inset:4px;background:#1a7a4a;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
        </div>`,
        className: '',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const handlePosition = (pos: GeolocationPosition) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;

        setGpsStatus('active');
        setUserLocation({ lat, lng });
        setUserAccuracy(Math.round(accuracy));

        // First fix — pan the map to user location
        if (!isCenteredRef.current) {
          map.setView([lat, lng], 15, { animate: true });
          setMapCenter({ lat, lng });
          isCenteredRef.current = true;
        }

        // Update or create user marker
        if (!userMarkerRef.current) {
          userMarkerRef.current = L.marker([lat, lng], { icon: pulseIcon(accuracy), zIndexOffset: 1000 })
            .bindTooltip('You are here', { permanent: false })
            .addTo(map);
        } else {
          userMarkerRef.current.setLatLng([lat, lng]);
        }

        // Update or create accuracy circle
        if (!accuracyCircleRef.current) {
          accuracyCircleRef.current = L.circle([lat, lng], {
            radius: accuracy,
            color: '#1a7a4a',
            fillColor: '#1a7a4a',
            fillOpacity: 0.08,
            weight: 1,
            dashArray: '4 4',
          }).addTo(map);
        } else {
          accuracyCircleRef.current.setLatLng([lat, lng]);
          accuracyCircleRef.current.setRadius(accuracy);
        }

        // Re-fetch cars if user moved >200m from last fetch point
        const last = lastFetchCoordsRef.current;
        if (!last) {
          lastFetchCoordsRef.current = { lat, lng };
          // Trigger car/report fetch via mapCenter update
          setMapCenter({ lat, lng });
          return;
        }
        const R = 6371000; // metres
        const dLat = (lat - last.lat) * Math.PI / 180;
        const dLng = (lng - last.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(last.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        const moved = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        if (moved > 200) {
          lastFetchCoordsRef.current = { lat, lng };
          setMapCenter({ lat, lng });
        }
      };

      const handleError = (err: GeolocationPositionError) => {
        if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
          setGpsStatus('denied');
        } else {
          setGpsStatus('unavailable');
        }
      };

      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePosition,
        handleError,
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );

      // ── Compass heading (DeviceOrientationEvent) ──────────────────────────
      const handleOrientation = (e: DeviceOrientationEvent) => {
        // 'webkitCompassHeading' is iOS; 'alpha' is Android (reversed)
        const compassHeading =
          (e as any).webkitCompassHeading ??
          (e.alpha !== null ? (360 - e.alpha) % 360 : NaN);
        if (isFinite(compassHeading)) setHeading(compassHeading);
      };

      orientationHandlerRef.current = handleOrientation;

      // iOS 13+ requires permission
      const DevOriEvent = DeviceOrientationEvent as any;
      if (typeof DevOriEvent.requestPermission === 'function') {
        DevOriEvent.requestPermission()
          .then((perm: string) => {
            if (perm === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation, true);
            }
          })
          .catch(() => {});
      } else {
        window.addEventListener('deviceorientation', handleOrientation, true);
      }
    })();

    return () => {
      // Stop GPS watch
      if (watchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      // Stop orientation listener
      if (orientationHandlerRef.current) {
        window.removeEventListener('deviceorientation', orientationHandlerRef.current, true);
        orientationHandlerRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      // Remove Leaflet's internal ID so the div can be re-initialized
      // (needed for React StrictMode double-invoke and fast-refresh)
      if (mapRef.current) {
        delete (mapRef.current as any)._leaflet_id;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Center map on user location ────────────────────────────────────────────
  const centerOnUser = useCallback(() => {
    if (!mapInstanceRef.current || !userLocation) return;
    mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 15, { animate: true });
  }, [userLocation]);

  // ─── Fetch cars ─────────────────────────────────────────────────────────────
  const fetchCars = useCallback(async () => {
    if (!mapInstanceRef.current) return;
    const center = mapInstanceRef.current.getCenter();
    try {
      const res = await fetch(`/api/map/cars?lat=${center.lat}&lng=${center.lng}&radius=15`);
      const data = await res.json();
      setCars(data.cars || []);
    } catch { /* silent fail */ }
  }, []);

  // ─── Fetch reports ───────────────────────────────────────────────────────────
  const fetchReports = useCallback(async () => {
    if (!mapInstanceRef.current) return;
    const center = mapInstanceRef.current.getCenter();
    try {
      const res = await fetch(`/api/map/reports?lat=${center.lat}&lng=${center.lng}&radius=20`);
      const data = await res.json();
      setReports(data.reports || []);
    } catch { /* silent fail */ }
  }, []);

  // ─── Initial data load ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;
    fetchCars();
    fetchReports();

    // Refresh every 30s
    const interval = setInterval(() => {
      fetchCars();
      fetchReports();
    }, 30000);
    return () => clearInterval(interval);
  }, [isLoading, fetchCars, fetchReports]);

  // ─── SSE stream ─────────────────────────────────────────────────────────────
  // Only reconnect the stream when the user moves >5km from the last stream origin.
  // This prevents a new EventSource being created on every small GPS update.
  useEffect(() => {
    if (isLoading) return;

    const { lat, lng } = mapCenter;

    // Haversine check — skip reconnect if within 5km of current stream origin
    const prev = sseStreamCenterRef.current;
    if (prev) {
      const R = 6371000;
      const dLat = (lat - prev.lat) * Math.PI / 180;
      const dLng = (lng - prev.lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(prev.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (dist < 5000) return; // within 5km — keep existing stream
    }

    sseStreamCenterRef.current = { lat, lng };
    const es = new EventSource(`/api/map/stream?lat=${lat}&lng=${lng}&radius=20`);
    es.addEventListener('reports', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.reports) setReports(data.reports);
      } catch { /* malformed event */ }
    });
    es.onerror = () => es.close();
    return () => es.close();
  }, [isLoading, mapCenter]);

  // ─── Render car markers ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current || !carLayerRef.current) return;

    import('leaflet').then(({ default: L }) => {
      carLayerRef.current.clearLayers();

      if (!layers.cars) return;

      cars.forEach(car => {
        const color = '#1a7a4a';
        const icon = L.divIcon({
          html: `<div style="background:${color};color:white;border-radius:20px;padding:3px 8px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.25);border:2px solid white;cursor:pointer;display:flex;align-items:center;gap:4px;">
            <span>🚗</span><span>${formatRWF(car.pricePerDay)}</span>
          </div>`,
          className: '',
          iconSize: [100, 28],
          iconAnchor: [50, 28],
        });

        const marker = L.marker([car.lat, car.lng], { icon });
        marker.on('click', () => setSelectedCar(car));
        carLayerRef.current.addLayer(marker);
      });
    });
  }, [cars, layers.cars]);

  // ─── Render report markers ───────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current || !reportLayerRef.current) return;

    import('leaflet').then(({ default: L }) => {
      reportLayerRef.current.clearLayers();

      if (!layers.reports) return;

      reports.forEach(report => {
        const info = REPORT_ICONS[report.type] || { emoji: '⚠️', color: '#f59e0b', label: report.type };
        const icon = L.divIcon({
          html: `<div style="background:${info.color};color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;cursor:pointer;">${info.emoji}</div>`,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const expiresIn = Math.max(0, Math.round((new Date(report.expiresAt).getTime() - Date.now()) / 60000));

        const marker = L.marker([report.lat, report.lng], { icon });
        marker.bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:150px;">
            <div style="font-weight:700;font-size:13px;margin-bottom:4px;">${info.emoji} ${info.label}</div>
            ${report.message ? `<div style="font-size:12px;color:#666;margin-bottom:4px;">${report.message}</div>` : ''}
            <div style="font-size:11px;color:#999;">⏱ Expires in ${expiresIn}min</div>
            <div style="font-size:11px;color:#999;">👍 ${report.upvotes} confirmations</div>
          </div>
        `, { maxWidth: 200 });
        reportLayerRef.current.addLayer(marker);
      });
    });
  }, [reports, layers.reports]);

  // ─── Heatmap ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (!layers.heatmap) {
      if (heatLayerRef.current) {
        mapInstanceRef.current.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      return;
    }

    fetch('/api/map/heatmap').then(r => r.json()).then(data => {
      import('leaflet').then(({ default: L }) => {
        if (heatLayerRef.current) {
          mapInstanceRef.current.removeLayer(heatLayerRef.current);
        }
        // Draw heatmap as colored circles (no extra library needed)
        const layer = L.layerGroup();
        const maxWeight = Math.max(...data.points.map((p: any) => p.weight), 1);
        data.points.forEach((point: { lat: number; lng: number; weight: number }) => {
          const intensity = point.weight / maxWeight;
          const color = intensity > 0.7 ? '#ef4444' : intensity > 0.4 ? '#f97316' : '#f59e0b';
          L.circle([point.lat, point.lng], {
            radius: 500 + intensity * 1500, // meters
            color: 'transparent',
            fillColor: color,
            fillOpacity: 0.2 + intensity * 0.3,
          }).addTo(layer);
        });
        layer.addTo(mapInstanceRef.current);
        heatLayerRef.current = layer;
      });
    }).catch(() => {});
  }, [layers.heatmap]);

  const clearRoute = useCallback(() => {
    routeLayerRef.current?.clearLayers();
    setRouteResult(null);
    setRouteSteps([]);
    setLayers(l => ({ ...l, route: false }));
  }, []);

  // ─── Satellite tile toggle ───────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import('leaflet').then(({ default: L }) => {
      const map = mapInstanceRef.current;
      if (satelliteMode) {
        if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
        if (!satelliteTileRef.current) {
          satelliteTileRef.current = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            { attribution: '© Esri World Imagery', maxZoom: 19 }
          );
        }
        satelliteTileRef.current.addTo(map);
      } else {
        if (satelliteTileRef.current) map.removeLayer(satelliteTileRef.current);
        if (tileLayerRef.current) tileLayerRef.current.addTo(map);
      }
    });
  }, [satelliteMode]);

  // ─── Geocoding (Nominatim) with debounce ────────────────────────────────────
  const geocode = useCallback((query: string) => {
    setDirectionsQuery(query);
    if (!query.trim()) { setGeoResults([]); return; }
    if (geocodeDebounceRef.current) clearTimeout(geocodeDebounceRef.current);
    geocodeDebounceRef.current = setTimeout(async () => {
      setIsGeocoding(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Rwanda')}&format=json&limit=5`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        setGeoResults(data.map((r: any) => ({
          lat: Number(r.lat),
          lng: Number(r.lon),
          name: r.display_name.split(',').slice(0, 3).join(', '),
        })));
      } catch { /* silent */ }
      finally { setIsGeocoding(false); }
    }, 400);
  }, []);

  // ─── Route to any destination ────────────────────────────────────────────────
  const routeToDestination = useCallback(async (dest: { lat: number; lng: number }, name: string) => {
    if (!userLocation) {
      toast.error('Enable location to get directions');
      return;
    }
    setIsRouting(true);
    setRouteDestName(name);
    setGeoResults([]);
    setDirectionsQuery(name);
    try {
      const res = await fetch('/api/map/routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: userLocation, destination: dest }),
      });
      const data = await res.json();
      if (data.route) {
        setRouteResult(data);
        setRouteSteps(data.steps || []);
        setLayers(l => ({ ...l, route: true }));
        import('leaflet').then(({ default: L }) => {
          routeLayerRef.current?.clearLayers();
          const coords = data.route.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
          L.polyline(coords, { color: '#1a7a4a', weight: 5, opacity: 0.8 }).addTo(routeLayerRef.current);
          mapInstanceRef.current.fitBounds(L.latLngBounds(coords), { padding: [60, 60] });
        });
        toast.success(`Route to ${name} found`);
      } else {
        toast.error(data.error || 'No route found');
      }
    } catch { toast.error('Could not calculate route. Please try again.'); }
    finally { setIsRouting(false); }
  }, [userLocation]);

  // ─── Route to a car ──────────────────────────────────────────────────────────
  const routeToCar = useCallback((car: MapCar) => {
    routeToDestination({ lat: car.lat, lng: car.lng }, `${car.year} ${car.make} ${car.model}`);
  }, [routeToDestination]);

  // ─── Live Location Awareness ─────────────────────────────────────────────────
  const { nearbyPOIs, currentAnnouncement, isAnnouncing, announcedCount } = useLocationAwareness({
    userLat: userLocation?.lat ?? null,
    userLng: userLocation?.lng ?? null,
    heading,
    enabled: !isLoading,
    preferences,
  });

  // Save preferences when they change
  const savePreferences = useCallback(async (prefs: POIPreferences) => {
    setPreferences(prefs);
    setIsSavingPrefs(true);
    try {
      await fetch('/api/map/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
    } catch {}
    finally { setIsSavingPrefs(false); }
  }, []);

  // Load preferences on mount
  useEffect(() => {
    fetch('/api/map/preferences')
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setPreferences({
            audioEnabled: data.audioEnabled ?? false,
            categories: data.categories ?? ['food', 'landmark', 'healthcare'],
            frequency: data.frequency ?? 'medium',
            radius: data.radius ?? 150,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="relative w-full h-full bg-gray-900">
      <style>{`
        @keyframes gpsPulse {
          0%   { transform: scale(1);   opacity: 0.25; }
          100% { transform: scale(3.5); opacity: 0; }
        }
      `}</style>

      {/* Map container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-dark-bg flex items-center justify-center z-[1000]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white font-medium">Loading Mobility Map</p>
            <p className="text-gray-400 text-sm mt-1">Fetching cars &amp; road conditions…</p>
          </div>
        </div>
      )}

      {/* GPS denied banner — sits below the top bar */}
      {!isLoading && gpsStatus === 'denied' && !locationDeniedDismissed && (
        <div className="absolute top-20 left-4 right-4 z-[998] bg-red-500/90 backdrop-blur-sm text-white rounded-2xl shadow-xl px-4 py-2.5 flex items-center gap-3">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <div className="flex-1 min-w-0 text-xs">
            <span className="font-bold">Location denied — </span>
            tap the 🔒 lock icon in your browser → Allow Location
          </div>
          <button onClick={() => setLocationDeniedDismissed(true)} className="flex-shrink-0 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Directions search panel */}
      {showDirections && !isLoading && (
        <div className="absolute top-20 left-4 right-4 z-[998]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Navigation className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs font-semibold text-text-secondary dark:text-gray-400">From: My location</span>
            </div>
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                <input
                  type="text"
                  value={directionsQuery}
                  onChange={e => geocode(e.target.value)}
                  placeholder="Where to? (e.g. Kigali Convention Centre)"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                  autoFocus
                />
                {isGeocoding && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <button
                onClick={() => { setShowDirections(false); setGeoResults([]); clearRoute(); }}
                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-text-secondary hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Geocode results */}
            {geocodeResults.length > 0 && (
              <div className="mt-2 space-y-1 max-h-52 overflow-y-auto">
                {geocodeResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => routeToDestination({ lat: r.lat, lng: r.lng }, r.name)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-text-primary dark:text-white truncate">{r.name}</span>
                    <ChevronRight className="w-4 h-4 text-text-light ml-auto flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Active route summary */}
          {routeResult && routeSteps.length === 0 && (
            <div className="mt-2 flex items-center gap-3 px-3 py-2 bg-primary/10 rounded-xl">
              <Navigation className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm font-semibold text-primary">{routeResult.distanceKm} km · {routeResult.durationMin} min</span>
              <button onClick={clearRoute} className="ml-auto text-text-secondary hover:text-red-500"><X className="w-4 h-4" /></button>
            </div>
          )}
          {/* Turn-by-turn steps */}
          {routeSteps.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl mt-2 max-h-52 overflow-y-auto">
              <div className="px-4 py-2 border-b border-border">
                <span className="text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wide">Turn-by-turn directions</span>
              </div>
              {routeSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-2.5 border-b border-border/50 last:border-0">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs font-bold">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-primary dark:text-white">{step.instruction}</div>
                    <div className="text-xs text-text-light mt-0.5">
                      {step.distance < 1000 ? `${step.distance}m` : `${(step.distance / 1000).toFixed(1)}km`}
                      {' · '}
                      {step.duration < 60 ? `${step.duration}s` : `${Math.ceil(step.duration / 60)}min`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top bar */}
      {!isLoading && (
        <div className="absolute top-4 left-4 right-4 z-[999] flex items-center gap-2">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg px-4 py-2.5 flex items-center gap-2 flex-1 min-w-0">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm text-text-secondary dark:text-gray-300 truncate">
              {cars.length} cars nearby · {reports.length} reports active
            </span>
            {/* GPS status pill */}
            <span className={`ml-auto flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
              gpsStatus === 'active'
                ? 'bg-green-100 text-green-700'
                : gpsStatus === 'requesting'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                gpsStatus === 'active' ? 'bg-green-500 animate-pulse' :
                gpsStatus === 'requesting' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'
              }`} />
              {gpsStatus === 'active'
                ? `GPS ±${userAccuracy}m`
                : gpsStatus === 'requesting'
                ? 'Locating…'
                : 'No GPS'}
            </span>
          </div>
          <button
            onClick={() => setShowLayers(v => !v)}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-3 hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            <Layers className="w-5 h-5 text-text-primary dark:text-white" />
          </button>
          {/* POI Settings button */}
          <button
            onClick={() => setShowPOISettings(true)}
            className={`rounded-2xl shadow-lg p-3 transition-colors flex-shrink-0 ${
              preferences.audioEnabled
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-gray-900 hover:bg-gray-50'
            }`}
            title="Location Awareness Settings"
          >
            {preferences.audioEnabled
              ? <Volume2 className="w-5 h-5" />
              : <VolumeX className="w-5 h-5 text-text-primary dark:text-white" />}
          </button>
        </div>
      )}

      {/* Layer controls dropdown */}
      {showLayers && (
        <div className="absolute top-20 right-4 z-[999] bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-4 w-52">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-sm text-text-primary dark:text-white">Map Layers</span>
            <button onClick={() => setShowLayers(false)}>
              <X className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
          {/* Satellite toggle */}
          <label className="flex items-center justify-between py-2 cursor-pointer border-b border-border mb-1">
            <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-gray-300">
              <Satellite className="w-4 h-4 text-blue-500" />
              Satellite
            </div>
            <div
              onClick={() => setSatelliteMode(v => !v)}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${satelliteMode ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${satelliteMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </label>
          {(Object.keys(layers) as (keyof MapLayers)[])
            .filter(k => k !== 'route')
            .map(key => (
              <label key={key} className="flex items-center justify-between py-2 cursor-pointer">
                <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-gray-300 capitalize">
                  {key === 'cars' && <Car className="w-4 h-4 text-primary" />}
                  {key === 'reports' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                  {key === 'heatmap' && <Zap className="w-4 h-4 text-red-500" />}
                  {key}
                </div>
                <div
                  onClick={() => setLayers(l => ({ ...l, [key]: !l[key] }))}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${layers[key] ? 'bg-primary' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${layers[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </label>
            ))}
          <div className="mt-2 pt-2 border-t border-border text-xs text-text-secondary dark:text-gray-500">
            {layers.heatmap && 'Heatmap shows rental demand zones'}
          </div>
        </div>
      )}

      {/* Route result banner — shown below directions panel when directions open */}
      {routeResult && !showDirections && (
        <div className="absolute top-20 left-4 right-4 z-[998] bg-primary text-white rounded-2xl shadow-xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Navigation className="w-5 h-5 flex-shrink-0" />
              <div>
                <div className="font-bold text-sm">Route to {routeDestName}</div>
                <div className="text-primary-light text-xs">{routeResult.distanceKm} km · {routeResult.durationMin} min</div>
              </div>
            </div>
            <button onClick={clearRoute} className="text-primary-light hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          {routeResult.warnings.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/20 space-y-1">
              {routeResult.warnings.map((w, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-yellow-200">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  {REPORT_ICONS[w.type]?.emoji || '⚠️'} {w.message} on your route
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Directions button */}
      {!isLoading && (
        <button
          onClick={() => { setShowDirections(v => !v); setGeoResults([]); }}
          title="Get Directions"
          className={`absolute bottom-40 right-4 z-[999] rounded-full p-3.5 shadow-xl transition-all active:scale-95 ${
            showDirections ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800 text-primary hover:bg-gray-50'
          }`}
        >
          <Navigation className="w-5 h-5" />
        </button>
      )}

      {/* Center on Me button */}
      {!isLoading && (
        <button
          onClick={gpsStatus === 'active' ? centerOnUser : () => {
            setGpsStatus('requesting');
            navigator.geolocation?.getCurrentPosition(
              pos => {
                const { latitude: lat, longitude: lng } = pos.coords;
                setUserLocation({ lat, lng });
                setGpsStatus('active');
                mapInstanceRef.current?.setView([lat, lng], 15, { animate: true });
              },
              err => setGpsStatus(err.code === 1 ? 'denied' : 'unavailable'),
              { enableHighAccuracy: true, timeout: 10000 }
            );
          }}
          title={gpsStatus === 'active' ? 'Centre on my location' : 'Enable GPS'}
          className={`absolute bottom-24 right-4 z-[999] rounded-full p-3.5 shadow-xl transition-all active:scale-95 ${
            gpsStatus === 'active'
              ? 'bg-primary text-white hover:bg-primary-dark'
              : gpsStatus === 'requesting'
              ? 'bg-yellow-500 text-white cursor-wait'
              : 'bg-white dark:bg-gray-800 text-primary hover:bg-gray-50'
          }`}
        >
          {gpsStatus === 'requesting'
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Crosshair className="w-5 h-5" />}
        </button>
      )}

      {/* FAB: Report Issue */}
      {!isLoading && (
        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              const c = mapInstanceRef.current.getCenter();
              setReportCoords({ lat: c.lat, lng: c.lng });
            }
            setShowReportModal(true);
          }}
          className="absolute bottom-10 right-4 z-[999] bg-red-500 hover:bg-red-600 text-white rounded-full p-4 shadow-xl flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
      )}

      {/* Car count badge */}
      {!isLoading && cars.length > 0 && (
        <div className="absolute bottom-10 left-4 z-[999] bg-white dark:bg-gray-900 rounded-2xl shadow-lg px-3 py-2 flex items-center gap-2">
          <Car className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-text-primary dark:text-white">{cars.length} cars</span>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        </div>
      )}

      {/* Selected Car Detail Panel */}
      {selectedCar && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl p-5 max-h-[55vh] overflow-y-auto">
          <div className="flex items-start gap-3">
            {/* Drag handle */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />

            {selectedCar.photos[0] ? (
              <img
                src={selectedCar.photos[0]}
                alt={selectedCar.make}
                className="w-24 rounded-xl object-cover flex-shrink-0 mt-4"
                style={{ height: '72px' }}
              />
            ) : (
              <div
                className="w-24 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 mt-4"
                style={{ height: '72px' }}
              >
                <Car className="w-8 h-8 text-gray-300" />
              </div>
            )}

            <div className="flex-1 min-w-0 pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-text-primary dark:text-white">
                    {selectedCar.year} {selectedCar.make} {selectedCar.model}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
                    <MapPin className="w-3 h-3" /> {selectedCar.district}
                    {selectedCar.rating > 0 && (
                      <span className="flex items-center gap-0.5 ml-1">
                        <Star className="w-3 h-3 text-accent-yellow fill-accent-yellow" />
                        {selectedCar.rating.toFixed(1)} · {selectedCar.totalTrips} trips
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelectedCar(null)} className="text-text-secondary p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <div className="text-2xl font-extrabold text-primary">{formatRWF(selectedCar.pricePerDay)}</div>
                <span className="text-text-secondary text-sm">/day</span>
                {selectedCar.instantBooking && (
                  <span className="flex items-center gap-1 text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full font-semibold">
                    <Zap className="w-3 h-3" /> Instant
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <a
              href={`/cars/${selectedCar.id}`}
              className="flex-1 bg-primary text-white rounded-xl py-3 text-center font-bold text-sm hover:bg-primary-dark transition-colors"
            >
              View &amp; Book
            </a>
            <button
              onClick={() => routeToCar(selectedCar)}
              disabled={isRouting}
              className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm font-semibold text-text-primary dark:text-white hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {isRouting ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Navigation className="w-4 h-4 text-primary" />
              )}
              Route
            </button>
          </div>
        </div>
      )}

      {/* POI Overlay — nearby places */}
      <POIOverlay
        nearbyPOIs={nearbyPOIs}
        currentAnnouncement={currentAnnouncement}
        isAnnouncing={isAnnouncing}
        audioEnabled={preferences.audioEnabled}
      />

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          coords={reportCoords || mapCenter}
          onClose={() => setShowReportModal(false)}
          onSubmitted={(report) => {
            setReports(prev => [report, ...prev]);
            setShowReportModal(false);
          }}
        />
      )}

      {/* POI Settings Panel */}
      {showPOISettings && (
        <POISettingsPanel
          open={showPOISettings}
          onClose={() => setShowPOISettings(false)}
          preferences={preferences}
          onChange={savePreferences}
          isSaving={isSavingPrefs}
          announcedCount={announcedCount}
        />
      )}
    </div>
  );
}

// ─── Report Modal ─────────────────────────────────────────────────────────────

interface ReportModalProps {
  coords: { lat: number; lng: number };
  onClose: () => void;
  onSubmitted: (report: MapReport) => void;
}

const REPORT_TYPES = [
  { value: 'TRAFFIC',   label: 'Traffic',    emoji: '🚦' },
  { value: 'ACCIDENT',  label: 'Accident',   emoji: '🚨' },
  { value: 'POLICE',    label: 'Police',     emoji: '👮' },
  { value: 'ROADBLOCK', label: 'Roadblock',  emoji: '🚧' },
  { value: 'FLOOD',     label: 'Flooding',   emoji: '🌊' },
  { value: 'POTHOLE',   label: 'Pothole',    emoji: '⚠️' },
];

const EXPIRY_MAP: Record<string, number> = {
  TRAFFIC: 2,
  ACCIDENT: 4,
  POLICE: 2,
  ROADBLOCK: 6,
  FLOOD: 12,
  POTHOLE: 48,
};

function ReportModal({ coords, onClose, onSubmitted }: ReportModalProps) {
  const [type, setType] = useState('TRAFFIC');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch('/api/map/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, lat: coords.lat, lng: coords.lng, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Report submitted — thanks for keeping roads safe!');
      onSubmitted(data);
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="absolute inset-0 z-[1001] bg-black/50 flex items-end justify-center">
      <div className="bg-white dark:bg-gray-900 w-full rounded-t-3xl p-5 shadow-2xl max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-lg text-text-primary dark:text-white">Report Road Issue</h3>
          <button onClick={onClose} className="text-text-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-text-secondary mb-4 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
        </p>

        {/* Type selector */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {REPORT_TYPES.map(rt => (
            <button
              key={rt.value}
              onClick={() => setType(rt.value)}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${
                type === rt.value
                  ? 'border-primary bg-primary-light dark:bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="text-2xl">{rt.emoji}</span>
              <span className="text-xs font-semibold text-text-primary dark:text-white">{rt.label}</span>
            </button>
          ))}
        </div>

        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Optional: add details (e.g. which lane, severity)"
          rows={2}
          maxLength={200}
          className="input resize-none mb-4 text-sm w-full"
        />

        <div className="flex items-center gap-2 text-xs text-text-secondary mb-4">
          <Clock className="w-3.5 h-3.5" />
          Report expires automatically after {EXPIRY_MAP[type] ?? 4} hours
        </div>

        <button
          onClick={submit}
          disabled={loading}
          className="btn-primary w-full justify-center py-3"
        >
          {loading ? 'Submitting…' : 'Submit Report'}
        </button>
      </div>
    </div>
  );
}
