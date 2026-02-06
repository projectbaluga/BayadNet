import React, { useState, useEffect } from 'react';
import {
  regions,
  provinces,
  city_mun,
  barangays
} from 'phil-reg-prov-mun-brgy';

const AddressSelector = ({ value, onChange, className }) => {
  // value can be an object { region, province, city, barangay, psgc } or null
  // We primarily rely on internal state, but sync with value if provided externally (e.g. initial load)

  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('');

  const [provinceList, setProvinceList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [barangayList, setBarangayList] = useState([]);

  useEffect(() => {
    if (value) {
        const { regionCode, provinceCode, cityCode, barangay } = value;

        if (regionCode && regionCode !== selectedRegion) {
             setSelectedRegion(regionCode);
             setProvinceList(provinces.filter(p => p.reg_code === regionCode));
        }
        if (provinceCode && provinceCode !== selectedProvince) {
             setSelectedProvince(provinceCode);
             setCityList(city_mun.filter(c => c.prov_code === provinceCode));
        }
        if (cityCode && cityCode !== selectedCity) {
             setSelectedCity(cityCode);
             setBarangayList(barangays.filter(b => b.mun_code === cityCode));
        }
        if (barangay && barangay !== selectedBarangay) {
             setSelectedBarangay(barangay);
        }
    }
  }, [value]);

  // Handlers
  const handleRegionChange = (e) => {
    const code = e.target.value;
    setSelectedRegion(code);
    setSelectedProvince('');
    setSelectedCity('');
    setSelectedBarangay('');
    setProvinceList(provinces.filter(p => p.reg_code === code));
    setCityList([]);
    setBarangayList([]);

    notifyChange(code, '', '', '');
  };

  const handleProvinceChange = (e) => {
    const code = e.target.value;
    setSelectedProvince(code);
    setSelectedCity('');
    setSelectedBarangay('');
    setCityList(city_mun.filter(c => c.prov_code === code));
    setBarangayList([]);

    notifyChange(selectedRegion, code, '', '');
  };

  const handleCityChange = (e) => {
    const code = e.target.value;
    setSelectedCity(code);
    setSelectedBarangay('');
    setBarangayList(barangays.filter(b => b.mun_code === code));

    notifyChange(selectedRegion, selectedProvince, code, '');
  };

  const handleBarangayChange = (e) => {
    const name = e.target.value; // Barangays don't have unique code in this lib, so we use name or index
    setSelectedBarangay(name);

    notifyChange(selectedRegion, selectedProvince, selectedCity, name);
  };

  const notifyChange = (regCode, provCode, cityCode, brgyName) => {
    const reg = regions.find(r => r.reg_code === regCode);
    const prov = provinces.find(p => p.prov_code === provCode);
    const city = city_mun.find(c => c.mun_code === cityCode);
    // Barangay is just a name in this library's usage mostly, or we find the object
    const brgy = barangays.find(b => b.mun_code === cityCode && b.name === brgyName);

    const fullAddress = [
      brgyName,
      city?.name,
      prov?.name,
      reg?.name
    ].filter(Boolean).join(', ');

    // PSGC Construction:
    // We have Mun Code (6 chars).
    // We don't have distinct Brgy Code in this lib.
    // We will use Mun Code as the primary PSGC identifier.
    const psgc = cityCode;

    if (onChange) {
      onChange({
        address: fullAddress,
        region: reg?.name || '',
        province: prov?.name || '',
        city: city?.name || '',
        barangay: brgyName || '',
        regionCode: regCode,
        provinceCode: provCode,
        cityCode: cityCode,
        psgc: psgc
      });
    }
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${className}`}>
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Region</label>
        <select
          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          value={selectedRegion}
          onChange={handleRegionChange}
        >
          <option value="">Select Region</option>
          {regions.map(r => (
            <option key={r.reg_code} value={r.reg_code}>{r.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Province</label>
        <select
          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          value={selectedProvince}
          onChange={handleProvinceChange}
          disabled={!selectedRegion}
        >
          <option value="">Select Province</option>
          {provinceList.map(p => (
            <option key={p.prov_code} value={p.prov_code}>{p.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">City / Municipality</label>
        <select
          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          value={selectedCity}
          onChange={handleCityChange}
          disabled={!selectedProvince}
        >
          <option value="">Select City/Mun</option>
          {cityList.map(c => (
            <option key={c.mun_code} value={c.mun_code}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Barangay</label>
        <select
          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          value={selectedBarangay}
          onChange={handleBarangayChange}
          disabled={!selectedCity}
        >
          <option value="">Select Barangay</option>
          {barangayList.map((b, idx) => (
            <option key={`${b.mun_code}-${idx}`} value={b.name}>{b.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default AddressSelector;
