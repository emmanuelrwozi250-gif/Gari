'use client';

import Link from 'next/link';

interface DistrictCount {
  district: string;
  count: number;
}

interface Props {
  districtCounts: DistrictCount[];
}

// All 30 Rwanda districts — approximate positions on a 500×420 SVG viewport
const DISTRICTS = [
  // Kigali
  { id: 'gasabo',     name: 'Gasabo',     x: 320, y: 178 },
  { id: 'kicukiro',   name: 'Kicukiro',   x: 312, y: 208 },
  { id: 'nyarugenge', name: 'Nyarugenge', x: 292, y: 195 },
  // Northern
  { id: 'musanze',  name: 'Musanze',  x: 150, y: 80  },
  { id: 'gicumbi',  name: 'Gicumbi',  x: 278, y: 90  },
  { id: 'rulindo',  name: 'Rulindo',  x: 268, y: 128 },
  { id: 'gakenke',  name: 'Gakenke',  x: 180, y: 100 },
  { id: 'burera',   name: 'Burera',   x: 158, y: 60  },
  // Southern
  { id: 'huye',       name: 'Huye',       x: 240, y: 310 },
  { id: 'nyanza',     name: 'Nyanza',     x: 268, y: 288 },
  { id: 'ruhango',    name: 'Ruhango',    x: 228, y: 278 },
  { id: 'muhanga',    name: 'Muhanga',    x: 208, y: 248 },
  { id: 'kamonyi',    name: 'Kamonyi',    x: 248, y: 228 },
  { id: 'gisagara',   name: 'Gisagara',   x: 258, y: 328 },
  { id: 'nyaruguru',  name: 'Nyaruguru',  x: 198, y: 348 },
  { id: 'nyamagabe',  name: 'Nyamagabe',  x: 178, y: 328 },
  // Eastern
  { id: 'rwamagana', name: 'Rwamagana', x: 348, y: 198 },
  { id: 'bugesera',  name: 'Bugesera',  x: 338, y: 238 },
  { id: 'kayonza',   name: 'Kayonza',   x: 378, y: 178 },
  { id: 'gatsibo',   name: 'Gatsibo',   x: 388, y: 148 },
  { id: 'nyagatare', name: 'Nyagatare', x: 418, y: 100 },
  { id: 'ngoma',     name: 'Ngoma',     x: 388, y: 228 },
  { id: 'kirehe',    name: 'Kirehe',    x: 418, y: 238 },
  // Western
  { id: 'rubavu',      name: 'Rubavu',      x: 80,  y: 118 },
  { id: 'nyabihu',     name: 'Nyabihu',     x: 108, y: 128 },
  { id: 'ngororero',   name: 'Ngororero',   x: 158, y: 198 },
  { id: 'karongi',     name: 'Karongi',     x: 138, y: 218 },
  { id: 'rutsiro',     name: 'Rutsiro',     x: 118, y: 178 },
  { id: 'nyamasheke',  name: 'Nyamasheke',  x: 98,  y: 268 },
  { id: 'rusizi',      name: 'Rusizi',      x: 78,  y: 298 },
];

export function MapClient({ districtCounts }: Props) {
  const countMap = new Map(districtCounts.map(d => [d.district.toLowerCase(), d.count]));

  return (
    <div className="w-full max-w-2xl mx-auto">
      <svg
        viewBox="0 0 500 420"
        className="w-full h-auto"
        aria-label="Rwanda districts map — click a district to browse cars"
      >
        {/* Lake Kivu (western border) */}
        <ellipse cx="75" cy="230" rx="22" ry="60" fill="#bfdbfe" fillOpacity={0.5} />

        {DISTRICTS.map(d => {
          const count = countMap.get(d.id) ?? 0;
          const hasCount = count > 0;
          return (
            <Link key={d.id} href={`/search?district=${d.id}`}>
              <g className="cursor-pointer group">
                {/* Outer glow ring for districts with cars */}
                {hasCount && (
                  <circle
                    cx={d.x} cy={d.y} r={19}
                    fill="#1a7a4a" fillOpacity={0.12}
                    className="group-hover:fill-opacity-20 transition-all duration-200"
                  />
                )}
                {/* Main circle */}
                <circle
                  cx={d.x} cy={d.y} r={12}
                  fill={hasCount ? '#1a7a4a' : '#e5e7eb'}
                  stroke={hasCount ? '#15673e' : '#d1d5db'}
                  strokeWidth={1.5}
                  className="group-hover:opacity-80 transition-all duration-200"
                />
                {/* Count or zero */}
                {hasCount ? (
                  <text
                    x={d.x} y={d.y + 4}
                    textAnchor="middle"
                    fontSize={9} fontWeight="bold" fill="white"
                    className="pointer-events-none select-none"
                  >
                    {count}
                  </text>
                ) : (
                  <text
                    x={d.x} y={d.y + 3.5}
                    textAnchor="middle"
                    fontSize={7.5} fill="#9ca3af"
                    className="pointer-events-none select-none"
                  >
                    0
                  </text>
                )}
                {/* District label */}
                <text
                  x={d.x} y={d.y + 26}
                  textAnchor="middle"
                  fontSize={7} fill="#6b7280"
                  className="pointer-events-none select-none"
                >
                  {d.name}
                </text>
              </g>
            </Link>
          );
        })}
      </svg>
      <p className="text-center text-xs text-gray-400 mt-2">
        Click any district to browse available cars
      </p>
    </div>
  );
}
