import React, { useState, useEffect } from 'react';
import { Compass, ShieldCheck, AlertTriangle, MapPin, Radio, Bell } from 'lucide-react';

export const DISTRICT_PRESETS = [
  { id: 'chennai', name: 'Chennai', lat: 13.0827, lng: 80.2707, region: 'Capital District' },
  { id: 'coimbatore', name: 'Coimbatore', lat: 11.0168, lng: 76.9558, region: 'Western Zone' },
  { id: 'madurai', name: 'Madurai', lat: 9.9252, lng: 78.1198, region: 'Southern Zone' },
  { id: 'tiruchirappalli', name: 'Tiruchirappalli (Trichy)', lat: 10.7905, lng: 78.7047, region: 'Central Zone' },
  { id: 'salem', name: 'Salem', lat: 11.6643, lng: 78.1460, region: 'Western Zone' },
  { id: 'tirunelveli', name: 'Tirunelveli', lat: 8.7139, lng: 77.7567, region: 'Southern Zone' },
  { id: 'erode', name: 'Erode', lat: 11.3410, lng: 77.7172, region: 'Western Zone' },
  { id: 'vellore', name: 'Vellore', lat: 12.9165, lng: 79.1325, region: 'Northern Zone' },
  { id: 'thanjavur', name: 'Thanjavur', lat: 10.7870, lng: 79.1378, region: 'Delta Region' },
  { id: 'kanchipuram', name: 'Kanchipuram', lat: 12.8342, lng: 79.7036, region: 'Northern Zone' },
  { id: 'thoothukudi', name: 'Thoothukudi (Tuticorin)', lat: 8.7642, lng: 78.1348, region: 'Coastal South' },
  { id: 'kanyakumari', name: 'Kanyakumari', lat: 8.0883, lng: 77.5385, region: 'Southern Tip' },
  { id: 'dindigul', name: 'Dindigul', lat: 10.3673, lng: 77.9803, region: 'Central Zone' },
  { id: 'tiruppur', name: 'Tiruppur', lat: 11.1085, lng: 77.3411, region: 'Western Zone' },
  { id: 'cuddalore', name: 'Cuddalore', lat: 11.7480, lng: 79.7714, region: 'Coastal Central' }
];

const DistrictMap = ({ 
  selectedDistrictId = 'chennai', 
  onDistrictChange, 
  userLat, 
  userLng, 
  alerts = [],
  height = '420px',
  showSelector = true
}) => {
  const [currentDistrict, setCurrentDistrict] = useState(
    DISTRICT_PRESETS.find(d => d.id === selectedDistrictId) || DISTRICT_PRESETS[0]
  );

  useEffect(() => {
    const found = DISTRICT_PRESETS.find(d => d.id === selectedDistrictId);
    if (found) {
      setCurrentDistrict(found);
    }
  }, [selectedDistrictId]);

  const handleSelectDistrict = (district) => {
    setCurrentDistrict(district);
    if (onDistrictChange) {
      onDistrictChange(district);
    }
  };

  // Map center coordinates (use live user GPS or district center)
  const mapCenterLat = userLat || currentDistrict.lat;
  const mapCenterLng = userLng || currentDistrict.lng;

  // Filter alerts for map view
  const activeSOSAlerts = alerts.filter(a => a.alert_status !== 'resolved');

  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${mapCenterLng - 0.08}%2C${mapCenterLat - 0.08}%2C${mapCenterLng + 0.08}%2C${mapCenterLat + 0.08}&layer=mapnik&marker=${mapCenterLat}%2C${mapCenterLng}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      
      {/* District Choose Box Bar */}
      {showSelector && (
        <div className="glass-panel" style={{ padding: '14px 18px', background: '#ffffff', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Compass color="#059669" size={22} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
                Operational District
              </div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                {currentDistrict.name} <span style={{ fontSize: '12px', fontWeight: '500', color: '#059669' }}>({currentDistrict.region})</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', maxWidth: '360px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <select 
                value={currentDistrict.id} 
                onChange={(e) => {
                  const selected = DISTRICT_PRESETS.find(d => d.id === e.target.value);
                  if (selected) handleSelectDistrict(selected);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#0f172a',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                {DISTRICT_PRESETS.map((d) => (
                  <option key={d.id} value={d.id}>
                    📍 {d.name} ({d.region})
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>
      )}

      {/* Interactive Map Render Box */}
      <div style={{ position: 'relative', width: '100%', height: height, borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--glass-shadow)' }}>
        
        {/* OpenStreetMap Embed Layer */}
        <iframe
          title={`Map of ${currentDistrict.name}`}
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight="0"
          marginWidth="0"
          src={osmUrl}
          style={{ filter: 'contrast(1.05) saturate(1.1)', border: 'none' }}
        ></iframe>

        {/* Floating Top Badge with District Coordinates & Live GPS Radar */}
        <div style={{ position: 'absolute', top: '14px', left: '14px', zIndex: 10, background: 'rgba(255, 255, 255, 0.94)', backdropFilter: 'blur(8px)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: userLat || activeSOSAlerts.length > 0 ? '#dc2626' : '#059669', display: 'inline-block', boxShadow: userLat || activeSOSAlerts.length > 0 ? '0 0 10px #dc2626' : '0 0 10px #059669' }} className="animate-pulse-sos"></span>
          <div style={{ fontSize: '12px' }}>
            <div style={{ fontWeight: '800', color: '#0f172a' }}>Live GPS Radar: {currentDistrict.name}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
              Center Lat: {mapCenterLat.toFixed(4)} | Lng: {mapCenterLng.toFixed(4)}
            </div>
          </div>
        </div>

        {/* Floating SOS Emergency Alert Pins Overlay on Map */}
        {(activeSOSAlerts.length > 0 || userLat) && (
          <div style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            zIndex: 10,
            background: 'rgba(254, 242, 242, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #fca5a5',
            borderRadius: '12px',
            padding: '12px 14px',
            maxWidth: '280px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 8px 20px rgba(220, 38, 38, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <AlertTriangle size={15} color="#dc2626" />
              <span>SOS Emergency Pin ({activeSOSAlerts.length || 1})</span>
            </div>

            {userLat ? (
              <div style={{ fontSize: '12px', color: '#991b1b', lineHeight: '1.4' }}>
                <div><strong>Live User Location:</strong> Lat {userLat.toFixed(4)}, Lng {userLng.toFixed(4)}</div>
                <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px', fontWeight: '600' }}>⚠️ High Priority Emergency Signal Active</div>
              </div>
            ) : (
              activeSOSAlerts.slice(0, 2).map(alert => (
                <div key={alert.id} style={{ fontSize: '12px', color: '#991b1b', borderTop: '1px solid #fee2e2', paddingTop: '6px' }}>
                  <div><strong>SOS #{alert.id} - {alert.user_name || 'Citizen User'}</strong></div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Lat: {parseFloat(alert.latitude).toFixed(4)}, Lng: {parseFloat(alert.longitude).toFixed(4)}</div>
                  <span className={`badge badge-${alert.alert_status}`} style={{ marginTop: '4px' }}>{alert.alert_status}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Floating Bottom Status Indicator */}
        <div style={{ position: 'absolute', bottom: '14px', right: '14px', zIndex: 10, background: '#ffffff', padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#0f172a', fontWeight: '600', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <ShieldCheck size={16} color="#059669" /> Active Safety Dispatch Unit Connected
        </div>

      </div>

    </div>
  );
};

export default DistrictMap;
