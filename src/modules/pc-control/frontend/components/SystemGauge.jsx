/**
 * AURA AI - System Gauge Component
 * J.A.R.V.I.S.-style holographic gauge with animated ring
 */

import React from 'react';

const SystemGauge = ({ value = 0, label = 'Usage', max = 100, unit = '%', color = '#00d4ff', size = 'large' }) => {
  const radius = size === 'large' ? 60 : 40;
  const strokeWidth = size === 'large' ? 8 : 6;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = Math.min(value / max, 1);
  const strokeDashoffset = circumference - progress * circumference;

  const isWarning = progress > 0.8;
  const isCritical = progress > 0.95;
  const gaugeColor = isCritical ? '#ff3355' : isWarning ? '#ffaa00' : color;

  return (
    <div className="aura-gauge">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="aura-gauge-svg"
      >
        {/* Background ring */}
        <circle
          stroke="rgba(0, 212, 255, 0.1)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress ring */}
        <circle
          stroke={gaugeColor}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset, transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Center text */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy=".3em"
          className="aura-gauge-value"
          fill={gaugeColor}
          fontSize={size === 'large' ? '28' : '20'}
          fontFamily="'Courier New', monospace"
          fontWeight="300"
        >
          {typeof value === 'number' ? value.toFixed(1) : value}
        </text>
      </svg>
      <div className="aura-gauge-label">
        <span style={{ color: gaugeColor }}>{label}</span>
        <span className="aura-gauge-unit">{unit}</span>
      </div>
      <style>{`
        .aura-gauge { display: flex; flex-direction: column; align-items: center; gap: 5px; }
        .aura-gauge-svg { filter: drop-shadow(0 0 8px ${gaugeColor}33); }
        .aura-gauge-label {
          display: flex; gap: 4px; align-items: center;
          font-size: 11px; letter-spacing: 1px; text-transform: uppercase;
        }
        .aura-gauge-unit { font-size: 10px; opacity: 0.6; }
      `}</style>
    </div>
  );
};

export default SystemGauge;