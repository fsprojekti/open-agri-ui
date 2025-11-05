// src/components/FarmMap.jsx
import * as React from 'react';
import Map, {Layer, Source} from 'react-map-gl/maplibre';

export default function FarmMap({
                                    initialPosition = {lng: 14.5058, lat: 46.0569},
                                    onLocationPicked
                                }) {
    const [point, setPoint] = React.useState(null); // GeoJSON Feature or null
    const [zoom, setZoom] = React.useState(12);

    const handleMapClick = React.useCallback((e) => {
        const {lng, lat} = e.lngLat;
        const feature = {
            type: 'Feature',
            geometry: {type: 'Point', coordinates: [lng, lat]},
            properties: {lng: +lng.toFixed(6), lat: +lat.toFixed(6)}
        };
        setPoint(feature);
        onLocationPicked?.({lng: +lng.toFixed(6), lat: +lat.toFixed(6)});
    }, [onLocationPicked]);

    return (
        <Map
            initialViewState={{longitude: initialPosition.lng, latitude: initialPosition.lat, zoom: 12}}
            onMove={(evt) => setZoom(evt.viewState.zoom)}
            style={{
                width: '100%',
                height: '60vh',
                cursor: 'crosshair',
                position: 'relative',
                overflow: 'hidden',
                zIndex: 1
            }}
            mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
            attributionControl={false}
            onClick={handleMapClick}
        >
            {point && (
                <Source id="picked-point" type="geojson" data={{type: 'FeatureCollection', features: [point]}}>
                    <Layer
                        id="picked-circle"
                        type="circle"
                        paint={{
                            'circle-radius': 26, // <-- now scales with size (ha) + zoom/lat
                            'circle-color': 'rgba(255,112,67,0.66)',
                            'circle-stroke-width': 2,
                            'circle-stroke-color': '#fff',
                            'circle-opacity': 0.9
                        }}
                    />
                </Source>
            )}
        </Map>
    );
}
