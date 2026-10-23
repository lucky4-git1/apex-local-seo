import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import { RankScan, RankScanPoint } from '../../../../server/src/types/index.js';
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Maximize2
} from 'lucide-react';
import L from 'leaflet';

export const RankingExplorerModule: React.FC = () => {
  const { currentLocation, showToast } = useApp();
  const [scans, setScans] = useState<RankScan[]>([]);
  const [activeScan, setActiveScan] = useState<RankScan | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<RankScanPoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  // Scan form state
  const [keyword, setKeyword] = useState('cosmetic dentist seattle');
  const [gridDim, setGridDim] = useState<3 | 5 | 7>(5);
  const [radiusKm, setRadiusKm] = useState<number>(5.0);

  // Map reference
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (currentLocation) {
      loadScans();
    }
  }, [currentLocation?.id]);

  const loadScans = async () => {
    if (!currentLocation) return;
    try {
      const scanList = await api.getRankScans(currentLocation.id);
      setScans(scanList);
      if (scanList.length > 0) {
        const fullDetails = await api.getRankScanDetails(scanList[0].id);
        setActiveScan(fullDetails);
      } else {
        setActiveScan(null);
      }
    } catch (err: any) {
      showToast(`Failed to load scans: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectScan = async (scanId: string) => {
    try {
      const details = await api.getRankScanDetails(scanId);
      setActiveScan(details);
      setSelectedPoint(null);
    } catch (err: any) {
      showToast(`Failed to load scan details: ${err.message}`, 'error');
    }
  };

  const handleRunNewScan = async () => {
    if (!currentLocation) return;
    setRunning(true);
    try {
      const newScan = await api.runRankScan(currentLocation.id, {
        keyword,
        gridDimension: gridDim,
        radiusKm
      });
      showToast(`Scan completed for "${keyword}"! SoLV: ${newScan.solv}%`);
      const details = await api.getRankScanDetails(newScan.id);
      setActiveScan(details);
      loadScans();
    } catch (err: any) {
      showToast(`Scan run failed: ${err.message}`, 'error');
    } finally {
      setRunning(false);
    }
  };

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || !activeScan) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([activeScan.centerLat, activeScan.centerLng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([activeScan.centerLat, activeScan.centerLng], 13);
    }

    // Render Markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();

      // Center Business Marker
      const centerIcon = L.divIcon({
        className: 'custom-center-marker',
        html: `<div style="background-color:#0f172a; color:#fff; border-radius:50%; width:34px; height:34px; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 3px 8px rgba(0,0,0,0.4);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });
      L.marker([activeScan.centerLat, activeScan.centerLng], { icon: centerIcon })
        .addTo(markersLayerRef.current)
        .bindTooltip(`<strong>${currentLocation?.title}</strong><br/>Store Origin`, { direction: 'top' });

      // Scan Points
      if (activeScan.points) {
        activeScan.points.forEach((pt) => {
          let pinClass = 'pin-rank-unranked';
          let label = '>20';

          if (pt.rank === 1) {
            pinClass = 'pin-rank-1';
            label = '1';
          } else if (pt.rank && pt.rank <= 3) {
            pinClass = 'pin-rank-top3';
            label = String(pt.rank);
          } else if (pt.rank && pt.rank <= 10) {
            pinClass = 'pin-rank-top10';
            label = String(pt.rank);
          } else if (pt.rank && pt.rank <= 20) {
            pinClass = 'pin-rank-low';
            label = String(pt.rank);
          }

          const icon = L.divIcon({
            className: 'custom-grid-marker',
            html: `<div class="ranking-pin ${pinClass}">${label}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          const marker = L.marker([pt.lat, pt.lng], { icon }).addTo(markersLayerRef.current!);
          marker.on('click', () => {
            setSelectedPoint(pt);
          });
        });
      }
    }
  }, [activeScan?.id, activeScan?.points]);

  if (!currentLocation) return null;

  return (
    <div className="d-flex flex-column gap-4">
      {/* Top Controls Bar */}
      <div className="ops-card p-3 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <input
            type="text"
            className="form-control form-control-sm"
            style={{ width: '240px' }}
            placeholder="Target Keyword..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />

          <select
            className="form-select form-select-sm"
            style={{ width: '130px' }}
            value={gridDim}
            onChange={(e) => setGridDim(Number(e.target.value) as any)}
          >
            <option value={3}>3x3 (9 pins)</option>
            <option value={5}>5x5 (25 pins)</option>
            <option value={7}>7x7 (49 pins)</option>
          </select>

          <select
            className="form-select form-select-sm"
            style={{ width: '130px' }}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
          >
            <option value={2.5}>2.5 km radius</option>
            <option value={5.0}>5.0 km radius</option>
            <option value={10.0}>10.0 km radius</option>
          </select>

          <button
            onClick={handleRunNewScan}
            disabled={running || !keyword.trim()}
            className="btn btn-sm btn-primary d-flex align-items-center gap-1"
          >
            <Sparkles size={14} />
            <span>{running ? 'Scanning Geo-Grid...' : 'Run Geo-Grid Scan'}</span>
          </button>
        </div>

        {/* Scan history selector */}
        {scans.length > 0 && (
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">Historical Scans:</span>
            <select
              className="form-select form-select-sm"
              style={{ width: '260px' }}
              value={activeScan?.id || ''}
              onChange={(e) => handleSelectScan(e.target.value)}
            >
              {scans.map((s) => (
                <option key={s.id} value={s.id}>
                  "{s.keyword}" ({new Date(s.createdAt).toLocaleDateString()}) — SoLV {s.solv}%
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Signature Metrics Banner */}
      {activeScan && (
        <div className="row g-3">
          {/* Metric 1: SoLV */}
          <div className="col-12 col-md-4">
            <div className="kpi-card">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <div className="kpi-title">Share of Local Voice (SoLV®)</div>
                <span className="badge bg-success-subtle text-success small">Top 3 Ratio</span>
              </div>
              <div className="kpi-value text-success">{activeScan.solv}%</div>
              <div className="text-muted small mt-2">
                Ranking in 3-Pack at <strong>{activeScan.top3Count} of {activeScan.totalPoints}</strong> scan coordinates.
              </div>
            </div>
          </div>

          {/* Metric 2: ARP */}
          <div className="col-12 col-md-4">
            <div className="kpi-card">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <div className="kpi-title">Average Rank Position (ARP)</div>
                <span className="badge bg-primary-subtle text-primary small">Visible Pins</span>
              </div>
              <div className="kpi-value text-primary">{activeScan.arp}</div>
              <div className="text-muted small mt-2">
                Average position where business appears within Top 20 results.
              </div>
            </div>
          </div>

          {/* Metric 3: ATRP */}
          <div className="col-12 col-md-4">
            <div className="kpi-card">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <div className="kpi-title">Average Total Rank Position (ATRP)</div>
                <span className="badge bg-secondary-subtle text-secondary small">Holistic Grid</span>
              </div>
              <div className="kpi-value text-dark">{activeScan.atrp}</div>
              <div className="text-muted small mt-2">
                Calculated across all points; unranked points penalized as rank 21.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Map & Side Inspector */}
      <div className="row g-3">
        <div className="col-12 col-lg-8">
          <div className="ops-card p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <h6 className="fw-bold m-0">
                  Geo-Grid Map: "{activeScan?.keyword}" ({activeScan?.radiusKm}km radius)
                </h6>
              </div>
              {/* Legend */}
              <div className="d-flex align-items-center gap-2 small">
                <div className="d-flex align-items-center gap-1">
                  <span className="ranking-pin pin-rank-1" style={{ width: 14, height: 14, fontSize: 8 }}>
                    1
                  </span>
                  <span>Rank 1</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <span className="ranking-pin pin-rank-top3" style={{ width: 14, height: 14, fontSize: 8 }}>
                    3
                  </span>
                  <span>Top 3</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <span className="ranking-pin pin-rank-top10" style={{ width: 14, height: 14, fontSize: 8 }}>
                    7
                  </span>
                  <span>Top 10</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <span className="ranking-pin pin-rank-unranked" style={{ width: 14, height: 14, fontSize: 8 }}>
                    -
                  </span>
                  <span>&gt;20</span>
                </div>
              </div>
            </div>

            <div ref={mapContainerRef} className="ranking-map-container" />

            <div className="mt-2 text-muted small d-flex align-items-center justify-content-between">
              <div>Click any pin to inspect observed rankings and local competitors at that coordinate.</div>
              <div className="font-mono">OpenStreetMap attribution / Search Simulation Provider</div>
            </div>
          </div>
        </div>

        {/* Side Point Inspector */}
        <div className="col-12 col-lg-4">
          <div className="ops-card h-100 p-3 d-flex flex-column">
            <div className="ops-card-header px-0 pt-0 border-bottom mb-3">
              <h6 className="fw-bold m-0">Coordinate Point Inspector</h6>
            </div>

            {selectedPoint ? (
              <div className="d-flex flex-column gap-3">
                <div className="p-3 rounded bg-light border">
                  <div className="text-muted small">Observed Local Rank:</div>
                  <div className="display-6 fw-bold text-primary my-1">
                    {selectedPoint.rank ? `#${selectedPoint.rank}` : '> 20 (Unranked)'}
                  </div>
                  <div className="text-muted small font-mono">
                    Lat: {selectedPoint.lat}, Lng: {selectedPoint.lng}
                  </div>
                </div>

                <div>
                  <h6 className="fw-bold small mb-2">Competitors Ranking Ahead at this Point:</h6>
                  <div className="d-flex flex-column gap-2">
                    {selectedPoint.competitors && selectedPoint.competitors.length > 0 ? (
                      selectedPoint.competitors.map((comp, idx) => (
                        <div
                          key={idx}
                          className="p-2 border rounded bg-white d-flex align-items-center justify-content-between small"
                        >
                          <span className="fw-medium text-dark">{comp.name}</span>
                          <span className="badge bg-secondary-subtle text-secondary">
                            Rank #{comp.rank}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted small">Your business ranks #1 at this coordinate!</div>
                    )}
                  </div>
                </div>

                <div className="mt-auto p-2 bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded small text-primary">
                  <strong>Local Pack Signal:</strong> Ranking in positions 1-3 captures 78% of local mobile search clicks in this sector.
                </div>
              </div>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center text-center p-4 my-auto text-muted">
                <MapPin size={36} className="text-secondary opacity-50 mb-2" />
                <div className="fw-semibold">No Point Selected</div>
                <div className="small">Click any numbered pin on the map to inspect competitors and distance.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
