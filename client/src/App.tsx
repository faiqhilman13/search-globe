import { useEffect, useMemo, useState } from "react";
import { fetchRegions, fetchTopByRegion, fetchTrends } from "./api";
import { Globe } from "./components/Globe";
import { TrendsPanel } from "./components/TrendsPanel";
import type { Country, RegionsMap, Trend } from "./types";

const windows = [7, 30, 90];

export default function App() {
  const [regions, setRegions] = useState<RegionsMap>({});
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>();
  const [selectedCountry, setSelectedCountry] = useState<string>();
  const [windowDays, setWindowDays] = useState(30);
  const [breakoutOnly, setBreakoutOnly] = useState(false);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [regionHot, setRegionHot] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRegions()
      .then((res) => {
        setRegions(res.regions);
        setCountries(res.countries);
        const firstRegion = Object.keys(res.regions)[0];
        if (firstRegion) setSelectedRegion(firstRegion);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!selectedRegion) return;
    const list = regions[selectedRegion];
    if (list && list.length) {
      setSelectedCountry(list[0].code);
    }
  }, [selectedRegion, regions]);

  useEffect(() => {
    if (!selectedRegion) return;
    fetchTopByRegion({ region: selectedRegion, windowDays })
      .then((res) => setRegionHot(res.data))
      .catch((err) => setError(err.message));
  }, [selectedRegion, windowDays]);

  useEffect(() => {
    if (!selectedCountry) return;
    setLoading(true);
    fetchTrends({ country: selectedCountry, windowDays, breakoutOnly })
      .then((res) => {
        setTrends(res.data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedCountry, windowDays, breakoutOnly]);

  const regionCountries = useMemo(
    () => (selectedRegion ? regions[selectedRegion] || [] : []),
    [regions, selectedRegion]
  );

  const handleSelectCountry = (code: string) => {
    setSelectedCountry(code);
    const found = countries.find((c) => c.code === code);
    if (found) setSelectedRegion(found.region);
  };

  return (
    <div className="app-shell">
      <div className="panel">
        <div className="header">
          <div>
            <div className="label">Google Trends</div>
            <div className="title">Trend Globe</div>
          </div>
          <div className="pill">Private</div>
        </div>

        <div className="control-group">
          <div>
            <div className="label">Region</div>
            <select
              className="select"
              value={selectedRegion || ""}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              {Object.keys(regions).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="label">Country</div>
            <select
              className="select"
              value={selectedCountry || ""}
              onChange={(e) => handleSelectCountry(e.target.value)}
            >
              {regionCountries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="label">Window</div>
            <div style={{ display: "flex", gap: 8 }}>
              {windows.map((w) => (
                <button
                  key={w}
                  className="btn"
                  style={{
                    background: w === windowDays ? "var(--accent)" : "transparent",
                    color: w === windowDays ? "#04101f" : "var(--text)",
                    border: `1px solid ${w === windowDays ? "transparent" : "var(--border)"}`
                  }}
                  onClick={() => setWindowDays(w)}
                >
                  {w}d
                </button>
              ))}
            </div>
          </div>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={breakoutOnly}
              onChange={(e) => setBreakoutOnly(e.target.checked)}
            />
            Breakout only
          </label>

          {error ? <div className="muted">Error: {error}</div> : null}
        </div>

        <div className="panel" style={{ marginTop: 12 }}>
          <div className="header">
            <div>
              <div className="label">Hot in {selectedRegion}</div>
              <div className="title">Cross-country</div>
            </div>
          </div>
          <div className="list">
            {regionHot.slice(0, 6).map((t, idx) => (
              <div key={t.term + idx} className="trend-item">
                <div>
                  <div className="label">#{idx + 1}</div>
                  <div className="trend-term">{t.term}</div>
                  <div className="muted">{t.countries}</div>
                </div>
                {t.breakout_flag ? <span className="tag">Breakout</span> : null}
              </div>
            ))}
            {!regionHot.length && <div className="muted">No data yet.</div>}
          </div>
        </div>
      </div>

      <Globe
        countries={countries}
        selectedCountry={selectedCountry}
        onSelect={handleSelectCountry}
      />

      <TrendsPanel
        country={selectedCountry}
        trends={trends}
        loading={loading}
        breakoutOnly={breakoutOnly}
        windowDays={windowDays}
      />
    </div>
  );
}
