import React, { useState } from 'react';
import { Compass, MapPin, CheckCircle, Search, ShieldAlert, ArrowRight } from 'lucide-react';
import { DISTRICT_PRESETS } from './DistrictMap';

const DistrictGatewayModal = ({ onSelectDistrict, initialDistrictId = 'chennai', role = 'CITIZEN' }) => {
  const [selectedId, setSelectedId] = useState(initialDistrictId);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = DISTRICT_PRESETS.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedDistrict = DISTRICT_PRESETS.find(d => d.id === selectedId) || DISTRICT_PRESETS[0];

  const handleConfirm = () => {
    if (onSelectDistrict) {
      onSelectDistrict(selectedDistrict);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justify: 'center',
      padding: '20px'
    }} className="animate-slide-in">
      
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '650px',
        maxHeight: '90vh',
        background: '#ffffff',
        borderRadius: '20px',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflowY: 'auto'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '18px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(5, 150, 105, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Compass size={26} color="#059669" />
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>Select Monitoring District</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Choose your district location before entering the {role === 'POLICE' ? 'Police Responder' : 'Citizen Safety'} Portal.
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <Search size={18} color="#64748b" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search Tamil Nadu district or zone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '42px', background: '#f8fafc', border: '1px solid #cbd5e1' }}
          />
        </div>

        {/* District Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '12px',
          maxHeight: '320px',
          overflowY: 'auto',
          paddingRight: '4px'
        }}>
          {filtered.map((district) => {
            const isSelected = district.id === selectedId;
            return (
              <div 
                key={district.id}
                onClick={() => setSelectedId(district.id)}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: isSelected ? '2px solid #059669' : '1px solid #e2e8f0',
                  background: isSelected ? '#ecfdf5' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: isSelected ? '#065f46' : '#0f172a' }}>
                    📍 {district.name}
                  </span>
                  {isSelected && <CheckCircle size={16} color="#059669" />}
                </div>
                <span style={{ fontSize: '11px', color: isSelected ? '#047857' : '#64748b' }}>
                  {district.region}
                </span>
              </div>
            );
          })}
        </div>

        {/* Selection Confirmation Bar */}
        <div style={{ 
          background: '#f8fafc', 
          border: '1px solid #e2e8f0', 
          borderRadius: '12px', 
          padding: '14px 18px', 
          display: 'flex', 
          alignItems: 'center', 
          justify: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Selected District</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
              {selectedDistrict.name} <span style={{ fontSize: '12px', color: '#059669', fontWeight: '500' }}>({selectedDistrict.region})</span>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-primary"
            onClick={handleConfirm}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 22px', fontSize: '14px' }}
          >
            Enter Portal <ArrowRight size={16} />
          </button>
        </div>

      </div>

    </div>
  );
};

export default DistrictGatewayModal;
