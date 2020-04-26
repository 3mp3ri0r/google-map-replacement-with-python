import React, { useRef, useEffect, useState } from "react";
import L, { Icon, Marker } from "leaflet";
import isEqual from "lodash.isequal";

// This part needed because of leaflet icon does not work properly with webpack
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
const DefaultIcon = new Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
});
Marker.prototype.options.icon = DefaultIcon;

interface LatLng {
  lat: number;
  lng: number;
}

const BACKEND_BASE_URL = "http://localhost:8080";

const MapsFE: React.FC = () => {
  let clickPosition: LatLng | undefined = undefined;
  const [currentClickPosition, setCurrentClickPosition] = useState<
    LatLng | undefined
  >();

  const geoJSONRef = useRef<L.GeoJSON | null>(null);
  const renderGeoJSON = async (coWorkGeoJSON: GeoJSON.FeatureCollection) => {
    if (mapRef.current && coWorkGeoJSON) {
      if (geoJSONRef.current) {
        geoJSONRef.current.removeFrom(mapRef.current);
      }
      geoJSONRef.current = L.geoJSON(coWorkGeoJSON, {
        onEachFeature: (feature, layer) => {
          layer.bindPopup(
            `<h1>${feature.properties.name}</h1><p>address: ${feature.properties.address}</p><p>website: ${feature.properties.website}</p>`
          );
        },
      }).addTo(mapRef.current);
    }
  };

  const getCoworkingGeoJSON = async () => {
    const response = await fetch(`${BACKEND_BASE_URL}/map`);
    const data = (await response.json()) as GeoJSON.FeatureCollection;
    renderGeoJSON(data);
  };

  // Initiate load data
  useEffect(() => {
    const getCoWorkData = async () => {
      await getCoworkingGeoJSON();
    };
    getCoWorkData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // create map
  const mapRef = useRef<L.Map>();
  useEffect(() => {
    mapRef.current = L.map("MapsFE", {
      center: [-7.2789647, 112.7013314],
      zoom: 13,
      layers: [
        L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        }),
      ],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getNearCoworkingGeoJSON = async (latLng: LatLng) => {
    const response = await fetch(
      `${BACKEND_BASE_URL}/map/${latLng?.lat}/${latLng?.lng}`
    );
    const data = (await response.json()) as GeoJSON.FeatureCollection;
    renderGeoJSON(data);
  };
  // Click handler
  useEffect(() => {
    const getAllCoWorkData = async () => {
      await getCoworkingGeoJSON();
    };
    const getNearCoWorkData = async (latLng: LatLng) => {
      await getNearCoworkingGeoJSON(latLng);
    };
    if (mapRef.current) {
      mapRef.current.on("click", (e: L.LeafletMouseEvent) => {
        if (isEqual(e.latlng, clickPosition)) {
          clickPosition = undefined;
          getAllCoWorkData();
        } else {
          clickPosition = { ...e.latlng };
          getNearCoWorkData(e.latlng);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div id="MapsFE" style={{ height: "100vh", width: "100vw" }}></div>;
};

export default MapsFE;
