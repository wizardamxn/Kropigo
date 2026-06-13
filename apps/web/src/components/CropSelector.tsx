'use client';

import React, { useState, useEffect } from 'react';
import { useGetCropsQuery } from '@/store/endpoints/cropsApi';
import { useTranslations } from 'next-intl';
import { Globe, Carrot, Apple, Wheat, Flame, Flower2, Sprout, Search, Check } from 'lucide-react';
import Pagination from '@/components/shared/Pagination';

const CATEGORIES = [
  { id: '', labelKey: 'allCrops', icon: Globe },
  { id: 'vegetable', labelKey: 'vegetables', icon: Carrot },
  { id: 'fruit', labelKey: 'fruits', icon: Apple },
  { id: 'grain', labelKey: 'grains', icon: Wheat },
  { id: 'spice', labelKey: 'spices', icon: Flame },
  { id: 'flower', labelKey: 'flowers', icon: Flower2 },
  { id: 'other', labelKey: 'other', icon: Sprout },
];

export default function CropSelector({ cropId, setCropId }: { cropId: string, setCropId: (id: string) => void }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 6;
  
  const t = useTranslations('cropSelector');
  const tCommon = useTranslations('common');

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      if (searchTerm) {
        setSelectedCategory(''); // Auto-select 'All Crops' when searching
      }
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading, isFetching } = useGetCropsQuery({
    category: selectedCategory || undefined,
    search: debouncedSearch,
    page,
    limit,
  });

  const crops = data?.data || [];
  const pagination = data?.pagination || { totalPages: 1, page: 1 };

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <div>
        <label className="block font-sans text-sm font-medium text-stone-800 dark:text-stone-300 mb-3 ml-1">
          {t('selectCategory')}
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.id);
                setSearchTerm('');
                setDebouncedSearch('');
                setPage(1);
              }}
              className={`px-4 py-2.5 rounded-xl font-sans text-sm font-medium transition-all inline-flex items-center ${
                selectedCategory === cat.id
                  ? 'bg-green-800 text-white shadow-md'
                  : 'bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900'
              }`}
            >
              {React.createElement(cat.icon, { className: "mr-2 h-4 w-4 shrink-0" })}
              {t(cat.labelKey as any)}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Grid */}
      <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm">
        <label className="block font-sans text-sm font-medium text-stone-800 dark:text-stone-300 mb-2 ml-1">
          {t('findYourCrop')}
        </label>
        
        {/* Search Bar */}
        <div className="relative mb-5">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-stone-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchAllCrops')}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-green-800 transition-all font-sans"
          />
        </div>

        {/* Crops Grid */}
        {isLoading || isFetching ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-800"></div>
          </div>
        ) : crops.length === 0 ? (
          <div className="text-center py-10 text-stone-500 font-sans">
            {t('noCropsFound')}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in">
            {crops.map((crop: any) => (
              <div
                key={crop._id}
                onClick={() => setCropId(crop._id)}
                className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all group ${
                  cropId === crop._id 
                    ? 'border-green-600 shadow-md ring-2 ring-green-600/20' 
                    : 'border-stone-200 dark:border-stone-800 hover:border-green-400/50 hover:shadow-sm'
                }`}
              >
                {/* Active Checkmark */}
                {cropId === crop._id && (
                  <div className="absolute top-2 right-2 bg-green-600 text-white p-1 rounded-full z-10 shadow-sm animate-in zoom-in">
                    <Check className="w-4 h-4" strokeWidth={3} />
                  </div>
                )}
                
                <div className="aspect-[4/3] bg-stone-100 dark:bg-stone-900 relative">
                  {crop.imageUrl ? (
                    <img 
                      src={crop.imageUrl} 
                      alt={crop.name} 
                      className={`w-full h-full object-cover transition-transform duration-500 ${cropId === crop._id ? 'scale-105' : 'group-hover:scale-105'}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400">{t('noImage')}</div>
                  )}
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  
                  {/* Text Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-white font-sans font-semibold text-lg drop-shadow-md">
                      {crop.nameHindi ? `${crop.nameHindi} (${crop.name.charAt(0).toUpperCase() + crop.name.slice(1)})` : crop.name.charAt(0).toUpperCase() + crop.name.slice(1)}
                    </h3>
                  </div>
                </div>
                
                {/* Description details card area */}
                {crop.description && (
                  <div className="p-3 bg-white dark:bg-stone-950 border-t border-stone-100 dark:border-stone-800">
                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 font-sans">
                      {crop.description}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          page={page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          isFetching={isFetching}
        />
      </div>
    </div>
  );
}
