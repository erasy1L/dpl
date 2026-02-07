import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapProps {
  longitude: number;
  latitude: number;
  zoom?: number;
  markerTitle?: string;
  className?: string;
}

const Map = ({
  longitude,
  latitude,
  zoom = 14,
  markerTitle = "Location",
  className = "",
}: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Get Mapbox access token from environment variable
    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    if (!accessToken) {
      console.error("Mapbox access token is not defined");
      return;
    }

    mapboxgl.accessToken = accessToken;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [longitude, latitude],
      zoom: zoom,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add marker
    marker.current = new mapboxgl.Marker({ color: "#3B82F6" })
      .setLngLat([longitude, latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div style="padding: 8px; font-weight: 600;">${markerTitle}</div>`,
        ),
      )
      .addTo(map.current);

    // Cleanup on unmount
    return () => {
      marker.current?.remove();
      map.current?.remove();
    };
  }, [longitude, latitude, zoom, markerTitle]);

  return (
    <div
      ref={mapContainer}
      className={`w-full h-full rounded-lg ${className}`}
      style={{ minHeight: "300px" }}
    />
  );
};

export default Map;
