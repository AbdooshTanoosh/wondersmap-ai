
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { divIcon } from "leaflet";

type MapLocation = {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
};

type Props = {
  isArabic: boolean;
};

// Sample locations for our first map test.
// We will replace these with verified itinerary locations.
const sampleLocations: MapLocation[] = [
  {
    id: "giza",
    name: "Pyramids of Giza",
    description: "Ancient pyramids near Cairo",
    latitude: 29.9792,
    longitude: 31.1342,
  },
  {
    id: "museum",
    name: "Egyptian Museum",
    description: "Museum at Tahrir Square",
    latitude: 30.0478,
    longitude: 31.2336,
  },
  {
    id: "khan",
    name: "Khan el-Khalili",
    description: "Historic market in Cairo",
    latitude: 30.0475,
    longitude: 31.2620,
  },
];

const markerIcon = divIcon({
  className: "wondersmap-marker",
  html: '<span aria-hidden="true">📍</span>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export default function TravelMap({ isArabic }: Props) {
  return (
    <section
      className="travel-map-section"
      aria-label={isArabic ? "خريطة الرحلة" : "Trip map"}
    >
      <h3>
        {isArabic ? "🗺️ خريطة الرحلة" : "🗺️ Trip Map"}
      </h3>

      <p>
        {isArabic
          ? "استكشف مواقع المعالم السياحية على الخريطة."
          : "Explore attraction locations on the map."}
      </p>

      <MapContainer
        center={[30.035, 31.19]}
        zoom={11}
        scrollWheelZoom={false}
        style={{
          height: "400px",
          width: "100%",
          borderRadius: "12px",
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {sampleLocations.map((location) => (
          <Marker
            key={location.id}
            position={[
              location.latitude,
              location.longitude,
            ]}
            icon={markerIcon}
          >
            <Popup>
              <strong>{location.name}</strong>
              <p>{location.description}</p>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <p className="budget-note">
        {isArabic
          ? "مواقع تجريبية لعرض الخريطة، وليست مرتبطة بعد ببرنامج الرحلة."
          : "Sample map locations. These are not yet linked to your itinerary."}
      </p>
    </section>
  );
}
