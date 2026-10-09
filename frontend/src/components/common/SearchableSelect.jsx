import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';

/**
 * Matka Helper Data Generators
 */
export const SINGLE_DIGITS = Array.from({ length: 10 }, (_, i) => String(i));

export const JODI_DIGITS = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, '0'));

export const TRIPLE_PANAS = Array.from({ length: 10 }, (_, i) => `${i}${i}${i}`);

const valOf = (d) => (d === 0 ? 10 : d);

export const SINGLE_PANAS = (() => {
  const result = [];
  for (let a = 0; a <= 9; a++) {
    for (let b = 0; b <= 9; b++) {
      for (let c = 0; c <= 9; c++) {
        if (a !== b && b !== c && a !== c) {
          const vA = valOf(a), vB = valOf(b), vC = valOf(c);
          if (vA < vB && vB < vC) {
            result.push(`${a}${b}${c}`);
          }
        }
      }
    }
  }
  return result;
})();

export const DOUBLE_PANAS = (() => {
  const result = [];
  for (let a = 0; a <= 9; a++) {
    for (let b = 0; b <= 9; b++) {
      for (let c = 0; c <= 9; c++) {
        if ((a === b && b !== c) || (a === c && a !== b) || (b === c && a !== b)) {
          const vA = valOf(a), vB = valOf(b), vC = valOf(c);
          if (vA <= vB && vB <= vC) {
            result.push(`${a}${b}${c}`);
          }
        }
      }
    }
  }
  return result;
})();

export const ALL_PANAS = [...SINGLE_PANAS, ...DOUBLE_PANAS, ...TRIPLE_PANAS];

/**
 * SearchableSelect Component
 */
const SearchableSelect = ({
  label,
  placeholder = 'Select number...',
  options = [],
  value = '',
  onChange,
  required = false,
  maxLength
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const filteredOptions = options.filter(opt =>
    String(opt).toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  const handleManualInputChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const cleanVal = maxLength ? rawVal.slice(0, maxLength) : rawVal;
    onChange(cleanVal);
    setSearch(cleanVal);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {label && <label className="form-label">{label}</label>}

      {/* Trigger Field */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          background: 'rgba(0, 0, 0, 0.4)',
          border: isOpen ? '1px solid var(--color-gold, #d6be66)' : '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '10px',
          cursor: 'pointer',
          color: '#ffffff',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 12px rgba(214, 190, 102, 0.25)' : 'none'
        }}
      >
        <span style={{
          fontSize: '0.95rem',
          fontWeight: value ? '700' : '400',
          color: value ? 'var(--color-gold, #d6be66)' : 'rgba(255, 255, 255, 0.4)'
        }}>
          {value ? value : placeholder}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {value && (
            <X
              size={16}
              style={{ color: 'rgba(255, 255, 255, 0.5)', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setSearch('');
              }}
            />
          )}
          <ChevronDown
            size={18}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              color: 'rgba(255, 255, 255, 0.7)'
            }}
          />
        </div>
      </div>

      {/* Hidden input for form submission if required */}
      {required && (
        <input
          type="text"
          value={value}
          onChange={() => {}}
          required
          style={{ opacity: 0, height: 0, width: 0, position: 'absolute', pointerEvents: 'none' }}
        />
      )}

      {/* Dropdown Menu Overlay */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 999,
            backgroundColor: '#0d1829',
            border: '1px solid rgba(214, 190, 102, 0.3)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.8)',
            padding: '12px',
            maxHeight: '300px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {/* Search Box Input inside Dropdown */}
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                color: 'var(--color-gold, #d6be66)'
              }}
            />
            <input
              type="text"
              placeholder={`Search ${label || 'number'}...`}
              value={search}
              onChange={(e) => {
                handleManualInputChange(e);
              }}
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(214, 190, 102, 0.4)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
            {search && (
              <X
                size={16}
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer'
                }}
              />
            )}
          </div>

          {/* Quick Select Grid / Options List */}
          <div style={{
            overflowY: 'auto',
            maxHeight: '220px',
            display: 'grid',
            gridTemplateColumns: options.length <= 10 ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)',
            gap: '6px',
            paddingRight: '4px'
          }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = String(value) === String(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    style={{
                      padding: '8px 4px',
                      backgroundColor: isSelected ? 'var(--color-gold, #d6be66)' : 'rgba(255, 255, 255, 0.05)',
                      border: isSelected ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: isSelected ? '#000000' : '#ffffff',
                      fontWeight: isSelected ? '800' : '600',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{opt}</span>
                    {isSelected && <Check size={12} />}
                  </button>
                );
              })
            ) : (
              <div style={{
                gridColumn: '1 / -1',
                padding: '16px',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.85rem'
              }}>
                No matching option found.
                {search && (
                  <button
                    type="button"
                    onClick={() => handleSelect(search)}
                    style={{
                      marginTop: '8px',
                      display: 'block',
                      width: '100%',
                      padding: '8px',
                      backgroundColor: 'rgba(214, 190, 102, 0.2)',
                      border: '1px solid var(--color-gold, #d6be66)',
                      borderRadius: '6px',
                      color: 'var(--color-gold, #d6be66)',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    Use "{search}"
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
