export const regions = {
  "North America": [
    { code: "US", name: "United States", lat: 38, lon: -97 },
    { code: "CA", name: "Canada", lat: 56, lon: -96 },
    { code: "MX", name: "Mexico", lat: 23, lon: -102 }
  ],
  Europe: [
    { code: "GB", name: "United Kingdom", lat: 54, lon: -2 },
    { code: "IE", name: "Ireland", lat: 53, lon: -8 },
    { code: "FR", name: "France", lat: 46, lon: 2 },
    { code: "DE", name: "Germany", lat: 51, lon: 10 },
    { code: "NL", name: "Netherlands", lat: 52, lon: 5 },
    { code: "BE", name: "Belgium", lat: 50.5, lon: 4.5 },
    { code: "LU", name: "Luxembourg", lat: 49.8, lon: 6.1 },
    { code: "CH", name: "Switzerland", lat: 46.8, lon: 8.3 },
    { code: "AT", name: "Austria", lat: 47.5, lon: 14.5 },
    { code: "ES", name: "Spain", lat: 40, lon: -3 },
    { code: "PT", name: "Portugal", lat: 39.5, lon: -8 },
    { code: "IT", name: "Italy", lat: 42.8, lon: 12.8 },
    { code: "SE", name: "Sweden", lat: 60, lon: 17 },
    { code: "NO", name: "Norway", lat: 60.5, lon: 8.5 },
    { code: "FI", name: "Finland", lat: 64, lon: 26 },
    { code: "DK", name: "Denmark", lat: 56, lon: 10 },
    { code: "IS", name: "Iceland", lat: 64, lon: -19 },
    { code: "PL", name: "Poland", lat: 52, lon: 19 },
    { code: "CZ", name: "Czechia", lat: 49.8, lon: 15.5 },
    { code: "SK", name: "Slovakia", lat: 48.7, lon: 19.5 },
    { code: "HU", name: "Hungary", lat: 47.2, lon: 19.5 },
    { code: "SI", name: "Slovenia", lat: 46.1, lon: 14.8 },
    { code: "HR", name: "Croatia", lat: 45.1, lon: 15.2 },
    { code: "BA", name: "Bosnia and Herzegovina", lat: 44.2, lon: 17.7 },
    { code: "RS", name: "Serbia", lat: 44, lon: 20.5 },
    { code: "BG", name: "Bulgaria", lat: 42.8, lon: 25 },
    { code: "RO", name: "Romania", lat: 45.9, lon: 24.9 },
    { code: "GR", name: "Greece", lat: 39, lon: 22 }
  ],
  "Middle East": [
    { code: "TR", name: "Turkey", lat: 39, lon: 35 },
    { code: "SA", name: "Saudi Arabia", lat: 24, lon: 45 },
    { code: "EG", name: "Egypt", lat: 26, lon: 30 },
    { code: "SY", name: "Syria", lat: 35, lon: 38 },
    { code: "PS", name: "Palestine", lat: 31.9, lon: 35.2 },
    { code: "JO", name: "Jordan", lat: 31, lon: 36 },
    { code: "LB", name: "Lebanon", lat: 33.8, lon: 35.8 }
  ],
  "Southeast Asia": [
    { code: "MY", name: "Malaysia", lat: 4, lon: 102 },
    { code: "SG", name: "Singapore", lat: 1.35, lon: 103.8 },
    { code: "ID", name: "Indonesia", lat: -2, lon: 118 },
    { code: "TH", name: "Thailand", lat: 15, lon: 101 },
    { code: "BN", name: "Brunei", lat: 4.5, lon: 114.7 },
    { code: "PH", name: "Philippines", lat: 12, lon: 122 }
  ],
  "East Asia": [
    { code: "CN", name: "China", lat: 35, lon: 105 },
    { code: "JP", name: "Japan", lat: 36, lon: 138 },
    { code: "KR", name: "South Korea", lat: 36, lon: 128 },
    { code: "TW", name: "Taiwan", lat: 23.7, lon: 121 }
  ]
};

export const allCountries = Object.entries(regions).flatMap(([region, list]) =>
  list.map((c) => ({ ...c, region }))
);
