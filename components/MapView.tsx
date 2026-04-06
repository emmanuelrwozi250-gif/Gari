'use client';

import { useEffect, useRef } from 'react';
import { formatRWF } from '@/lib/utils';

export interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  type: 'car' | 'user' | 'pickup';
  carId?: string;
  photo?: string;
  price?: number;
  available?: boolean;
}

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  onMarkerClick?: (carId: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  showUserLocation?: boolean;
  className?: string;
  height?: string;
}

export function MapView({
  center = [-1.9441, 30.0619], // Kigali default
  zoom = 12,
  markers = [],
  onMarkerClick,
  onMapClick,
  showUserLocation = false,
  className = '',
  height = '400px',
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Dynamically import Leaflet (client-only)
    import('leaflet').then(L => {
      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!, { zoomControl: true, scrollWheelZoom: true });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      map.setView(center, zoom);

      if (onMapClick) {
        map.on('click', (e: any) => onMapClick(e.latlng.lat, e.latlng.lng));
      }

      mapInstanceRef.current = map;

      // Add "Center on my location" button
      if (showUserLocation) {
        const btn = (L.control as any)({ position: 'bottomright' });
        btn.onAdd = () => {
          const div = L.DomUtil.create('div', '');
          div.innerHTML = `<button style="background:white;border:2px solid #1a7a4a;border-radius:50%;width:40px;height:40px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.15);font-size:18px;" title="My Location">📍</button>`;
          div.onclick = () => {
            navigator.geolocation?.getCurrentPosition(pos => {
              map.setView([pos.coords.latitude, pos.coords.longitude], 14);
            });
          };
          return div;
        };
        btn.addTo(map);
      }

      // Add markers
      addMarkers(L, map, markers, onMarkerClick);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers when they change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import('leaflet').then(L => {
      // Remove old markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      addMarkers(L, mapInstanceRef.current, markers, onMarkerClick);
    });
  }, [markers]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update center
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  function addMarkers(L: any, map: any, markers: MapMarker[], onClick?: (id: string) => void) {
    markers.forEach(marker => {
      let icon;
      if (marker.type === 'user') {
        icon = L.divIcon({
          html: `<div class="user-location-pulse"></div>`,
          className: '',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
      } else if (marker.type === 'car') {
        const color = marker.available !== false ? '#1a7a4a' : '#9ca3af';
        icon = L.divIcon({
          html: `<div style="background:${color};color:white;border-radius:20px;padding:4px 8px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2);border:2px solid white;">
            ${marker.price ? formatRWF(marker.price).replace('RWF ', 'RWF ') : ''}
          </div>`,
          className: '',
          iconSize: [80, 28],
          iconAnchor: [40, 28],
        });
      } else {
        icon = L.divIcon({
          html: `<div style="background:#3b82f6;color:white;border-radius:50%;width:12px;height:12px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
          className: '',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
      }

      const m = L.marker([marker.lat, marker.lng], { icon }).addTo(map);

      if (marker.type === 'car' && marker.carId) {
        m.bindPopup(`
          <div style="min-width:160px;font-family:Inter,sans-serif;">
            ${marker.photo ? `<img src="${marker.photo}" style="width:100%;height:90px;object-fit:cover;border-radius:8px 8px 0 0;" />` : ''}
            <div style="padding:8px;">
              <div style="font-weight:600;font-size:13px;margin-bottom:2px;">${marker.label}</div>
              ${marker.price ? `<div style="color:#1a7a4a;font-weight:700;font-size:12px;">${formatRWF(marker.price)}/day</div>` : ''}
              <a href="/cars/${marker.carId}" style="display:inline-block;margin-top:6px;background:#1a7a4a;color:white;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;text-decoration:none;">View Car</a>
            </div>
          </div>
        `, { maxWidth: 200 });

        if (onClick) {
          m.on('click', () => onClick(marker.carId!));
        }
      }

      markersRef.current.push(m);
    });
  }

  return (
    <div className={`relative rounded-xl overflow-hidden border border-border ${className}`} style={{ height }}>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
