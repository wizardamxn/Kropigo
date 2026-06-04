'use client';

import { useGetCropsQuery } from '@/store/endpoints/cropsApi';
import { useGetListingsQuery, useCreateListingMutation } from '@/store/endpoints/listingsApi';
import { useGetMandiRatesQuery } from '@/store/endpoints/mandiApi';
import { useState } from 'react';

export default function MVPTestPage() {
  const { data: cropsData, isLoading: cropsLoading } = useGetCropsQuery();
  const { data: listingsData, isLoading: listingsLoading } = useGetListingsQuery({});
  
  const [selectedCrop, setSelectedCrop] = useState('');
  const { data: mandiData } = useGetMandiRatesQuery(selectedCrop, { skip: !selectedCrop });
  
  const [createListing, { isLoading: isCreating }] = useCreateListingMutation();

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrop) return alert('Select a crop');

    try {
      const res = await createListing({
        cropId: selectedCrop,
        quantity: '100',
        unit: 'kg',
        farmAddress: '123 Farm Road',
        farmState: 'Punjab',
        farmDistrict: 'Ludhiana',
        mediaUrls: [],
      }).unwrap();
      alert(`Listing created! Reference Mandi Rate: ${res.message}`);
    } catch (err: any) {
      alert(`Error: ${err.data?.message || err.message}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API MVP Test Page</h1>

      <section className="mb-8 border p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">1. Select Crop & View Mandi Rate</h2>
        {cropsLoading ? <p>Loading crops...</p> : (
          <select 
            value={selectedCrop} 
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">-- Select a crop --</option>
            {cropsData?.data?.map((c: any) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        )}

        {mandiData && (
          <div className="mt-4 p-4 bg-green-50 text-green-800 rounded">
            <p className="font-semibold">Mandi Rates for selected crop:</p>
            {mandiData.data.length > 0 ? (
              mandiData.data.map((m: any) => (
                <div key={m._id} className="text-sm">
                  {m.market} ({new Date(m.date).toLocaleDateString()}): ₹{m.minPrice} - ₹{m.maxPrice} (Modal: ₹{m.modalPrice})
                </div>
              ))
            ) : (
              <p>No recent rates found.</p>
            )}
          </div>
        )}
      </section>

      <section className="mb-8 border p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">2. Test Listing Creation</h2>
        <p className="text-sm text-gray-500 mb-4">Note: This will submit a dummy listing (100kg, ₹5000) for the selected crop. File upload logic is present but no files are attached in this MVP test.</p>
        <button 
          onClick={handleCreateListing}
          disabled={isCreating || !selectedCrop}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : 'Create Dummy Listing'}
        </button>
      </section>

      <section className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">3. All Listings</h2>
        {listingsLoading ? <p>Loading listings...</p> : (
          <div className="space-y-4">
            {listingsData?.data?.length > 0 ? (
              listingsData.data.map((l: any) => (
                <div key={l._id} className="p-4 border rounded bg-gray-50">
                  <p><strong>Crop:</strong> {l.cropId?.name}</p>
                  <p><strong>Quantity:</strong> {l.quantity} {l.unit}</p>
                  <p><strong>Location:</strong> {l.farmDistrict}, {l.farmState}</p>
                  <p><strong>Status:</strong> {l.status}</p>
                </div>
              ))
            ) : (
              <p>No listings found.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
