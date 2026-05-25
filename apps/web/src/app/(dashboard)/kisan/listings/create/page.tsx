'use client';

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import CropSelector from "@/components/CropSelector";
import { useGetMandiRatesQuery } from "@/store/endpoints/mandiApi";
import { useCreateListingMutation } from "@/store/endpoints/listingsApi";
import {
  useDeleteCloudinaryMediaMutation,
  useGetCloudinarySignatureMutation,
} from "@/store/endpoints/mediaApi";
import { uploadListingMedia, validateMediaFiles } from "@/lib/cloudinaryUpload";

const UNITS = ["kg", "quintal", "ton"];
const MAX_IMAGES = 6;
type MediaPreview = { url: string; name: string; type: string };

export default function CreateListing() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaPreviewsRef = useRef<MediaPreview[]>([]);

  const [cropId, setCropId] = useState("");
  const [variety, setVariety] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("quintal");
  const [askingPrice, setAskingPrice] = useState("");
  const [description, setDescription] = useState("");
  const [farmAddress, setFarmAddress] = useState("");
  const [farmState, setFarmState] = useState("");
  const [farmDistrict, setFarmDistrict] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<MediaPreview[]>([]);


  const { data: mandiData } = useGetMandiRatesQuery(cropId, { skip: !cropId });
  const [createListing, { isLoading }] = useCreateListingMutation();
  const [getCloudinarySignature] = useGetCloudinarySignatureMutation();
  const [deleteCloudinaryMedia] = useDeleteCloudinaryMediaMutation();


  const mandiRates: any[] = mandiData?.data ?? [];
  const latestRate = mandiRates[0];
  const isSubmitting = isLoading || isUploading;

  // Keep ref in sync so unmount cleanup always revokes current URLs
  useEffect(() => {
    mediaPreviewsRef.current = mediaPreviews;
  }, [mediaPreviews]);

  useEffect(() => {
    return () => {
      mediaPreviewsRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, []);

  const handleFileChange = () => {
    const files = fileInputRef.current?.files;
    setError("");

    if (!files || files.length === 0) return;

    try {
      // Validate new files against remaining slots
      const newFiles = validateMediaFiles(files, selectedFiles.length);
      const newPreviews = newFiles.map((file) => ({
        url: URL.createObjectURL(file),
        name: file.name,
        type: file.type,
      }));

      setSelectedFiles((prev) => [...prev, ...newFiles]);
      setMediaPreviews((prev) => [...prev, ...newPreviews]);

      // Reset input so re-selecting the same files works next time
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setError(err?.message ?? "Invalid media selection.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleRemovePreview = (indexToRemove: number) => {
    URL.revokeObjectURL(mediaPreviews[indexToRemove].url);
    setMediaPreviews((prev) => prev.filter((_, i) => i !== indexToRemove));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setError("");

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;
      setLat(String(latitude));
      setLng(String(longitude));

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
        { headers: { Accept: "application/json" } }
      );

      if (!res.ok) throw new Error("Could not fetch address details.");

      const data = await res.json();
      const addr = data.address ?? {};

      const locality =
        addr.village || addr.hamlet || addr.suburb || addr.town || addr.city || "";
      const district =
        addr.county || addr.district || addr.state_district || "";
      const state = addr.state || "";

      if (locality) setFarmAddress(locality);
      if (district) setFarmDistrict(district);
      if (state) setFarmState(state);
    } catch (err: any) {
      const msg =
        err?.code === 1
          ? "Location access denied. Please allow location permissions in your browser."
          : "Could not determine your location. Please enter it manually.";
      setError(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const uploadedMediaUrls: string[] = [];

    try {
      setIsUploading(true);
      const mediaUrls = await uploadListingMedia(
        selectedFiles,
        () => getCloudinarySignature().unwrap(),
        0,
        (url) => uploadedMediaUrls.push(url)
      );

      await createListing({
        cropId,
        variety: variety || undefined,
        quantity,
        unit,
        askingPrice,
        description,
        farmAddress,
        farmState,
        farmDistrict,
        lat: lat || undefined,
        lng: lng || undefined,
        mediaUrls,
      }).unwrap();

      router.push("/kisan/listings");
    } catch (err: any) {
      if (uploadedMediaUrls.length > 0) {
        try {
          await deleteCloudinaryMedia({ mediaUrls: uploadedMediaUrls }).unwrap();
        } catch (cleanupError) {
          console.error("Failed to cleanup Cloudinary uploads:", cleanupError);
        }
      }

      setError(
        err?.data?.message ??
          err?.message ??
          "Failed to create listing. Please try again."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsUploading(false);
    }
  };

  const inputBaseClass =
    "h-12 w-full rounded-xl bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 px-4 font-sans focus:outline-none focus:ring-2 focus:ring-green-800 dark:focus:ring-green-700 focus:border-transparent transition-all shadow-sm";
  const labelBaseClass =
    "block font-sans text-sm font-medium text-stone-800 dark:text-stone-300 mb-1.5 ml-1";

  return (
    <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-12">

      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
          Create New Listing
        </h1>
        <p className="font-sans text-stone-600 dark:text-stone-400 mt-2 text-lg">
          List your harvest on the marketplace. Provide clear details to attract the best buyers.
        </p>
      </div>

      {/* Time Constraint Warning */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 flex gap-3 shadow-sm">
        <svg className="w-6 h-6 text-amber-600 dark:text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="font-sans text-sm text-amber-800 dark:text-amber-300">
          <strong className="font-medium block mb-0.5">Market Hours Notice</strong>
          Listings can only be officially created and published between{" "}
          <span className="font-semibold">10:00 AM – 5:00 PM IST</span>.
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-4 flex gap-3 shadow-sm animate-in slide-in-from-top-2">
          <svg className="w-6 h-6 text-red-600 dark:text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-sans text-sm font-medium text-red-800 dark:text-red-300">
            {error}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Section 1: Crop Details */}
        <section className="bg-stone-50 dark:bg-stone-900 rounded-2xl p-5 md:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
          <h2 className="font-serif text-2xl text-stone-800 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-3">
            Crop Details
          </h2>

          <CropSelector cropId={cropId} setCropId={setCropId} />

          <div>
            <label className={labelBaseClass}>Variety (Optional)</label>
            <input
              type="text"
              value={variety}
              onChange={(e) => setVariety(e.target.value)}
              placeholder="e.g. Sharbati, Alphonso, Hass"
              className={inputBaseClass}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex-1">
              <label className={labelBaseClass}>Quantity *</label>
              <input
                type="number"
                min="0"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                placeholder="e.g. 50"
                className={inputBaseClass}
              />
            </div>
            <div className="sm:w-1/3">
              <label className={labelBaseClass}>Unit *</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className={`${inputBaseClass} appearance-none cursor-pointer`}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Dynamic Mandi Rate Widget */}
        {latestRate && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-2xl p-5 flex items-start gap-4 shadow-sm transition-all animate-in zoom-in-95">
            <div className="p-2 bg-white dark:bg-stone-800 rounded-full shadow-sm text-green-700 dark:text-green-500 mt-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h3 className="font-sans font-semibold text-green-900 dark:text-green-400 mb-1">
                Market Insight
              </h3>
              <p className="font-sans text-sm text-green-800 dark:text-green-300 leading-relaxed">
                The current daily Mandi rate for this crop at <strong>{latestRate.market}</strong> is tracking between{" "}
                <br className="hidden sm:block" />
                <span className="font-mono text-base font-bold bg-green-200/50 dark:bg-green-800/50 px-2 py-0.5 rounded">
                  ₹{latestRate.minPrice} – ₹{latestRate.maxPrice}
                </span>{" "}
                per {latestRate.unit}.
              </p>
            </div>
          </div>
        )}

        {/* Section 2: Pricing & Description */}
        <section className="bg-stone-50 dark:bg-stone-900 rounded-2xl p-5 md:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
          <h2 className="font-serif text-2xl text-stone-800 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-3">
            Pricing & Details
          </h2>

          <div>
            <label className={labelBaseClass}>Your Asking Price (per {unit}) *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-stone-500 font-sans font-medium">₹</span>
              </div>
              <input
                type="number"
                min="0"
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
                required
                placeholder="Enter amount"
                className={`${inputBaseClass} pl-8`}
              />
            </div>
          </div>

          <div>
            <label className={labelBaseClass}>Description (Optional)</label>
            <textarea
              maxLength={1000}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about crop quality, harvest date, or special conditions..."
              className="w-full rounded-xl bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 p-4 font-sans focus:outline-none focus:ring-2 focus:ring-green-800 dark:focus:ring-green-700 focus:border-transparent transition-all shadow-sm resize-y"
            />
            <div className="text-right mt-1 text-xs text-stone-500 dark:text-stone-400 font-sans">
              {description.length}/1000
            </div>
          </div>
        </section>

        {/* Section 3: Location */}
        <section className="bg-stone-50 dark:bg-stone-900 rounded-2xl p-5 md:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
            <svg className="w-6 h-6 text-stone-500 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="font-serif text-2xl text-stone-800 dark:text-stone-100">
              Pickup Location
            </h2>
          </div>

          {/* Auto-detect location button */}
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isLocating || isSubmitting}
            className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl border-2 border-green-700 dark:border-green-600 text-green-800 dark:text-green-400 font-sans font-medium text-sm hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLocating ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Detecting location...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06z" />
                </svg>
                Use My Current Location
              </>
            )}
          </button>

          {lat && lng && (
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans text-center -mt-2">
              GPS coordinates captured ({parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}). You can edit the fields below if needed.
            </p>
          )}

          <div>
            <label className={labelBaseClass}>Farm Address / Village *</label>
            <input
              type="text"
              value={farmAddress}
              onChange={(e) => setFarmAddress(e.target.value)}
              required
              placeholder="e.g. Plot 42, Near Checkpost"
              className={inputBaseClass}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelBaseClass}>District *</label>
              <input
                type="text"
                value={farmDistrict}
                onChange={(e) => setFarmDistrict(e.target.value)}
                required
                placeholder="e.g. Jabalpur"
                className={inputBaseClass}
              />
            </div>
            <div>
              <label className={labelBaseClass}>State *</label>
              <input
                type="text"
                value={farmState}
                onChange={(e) => setFarmState(e.target.value)}
                required
                placeholder="e.g. Madhya Pradesh"
                className={inputBaseClass}
              />
            </div>
          </div>
        </section>

        {/* Section 4: Media Upload */}
        <section className="bg-stone-50 dark:bg-stone-900 rounded-2xl p-5 md:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-stone-500 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h2 className="font-serif text-2xl text-stone-800 dark:text-stone-100">
                Media Files
              </h2>
            </div>
            {/* Image counter */}
            <span className={`font-sans text-sm font-semibold px-3 py-1 rounded-full ${
              mediaPreviews.length >= MAX_IMAGES
                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                : "bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300"
            }`}>
              {mediaPreviews.length} / {MAX_IMAGES}
            </span>
          </div>

          <div>
            <label className={labelBaseClass}>Photos & Videos (Max {MAX_IMAGES})</label>
            <div className={`mt-2 flex justify-center px-6 py-8 border-2 border-dashed rounded-xl transition-colors ${
              mediaPreviews.length >= MAX_IMAGES
                ? "border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 opacity-60 cursor-not-allowed"
                : "border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 hover:bg-stone-50 dark:hover:bg-stone-900"
            }`}>
              <div className="space-y-2 text-center flex flex-col items-center">
                <svg className="mx-auto h-12 w-12 text-stone-400 dark:text-stone-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-stone-600 dark:text-stone-400">
                  {mediaPreviews.length >= MAX_IMAGES ? (
                    <p className="font-medium text-stone-500 dark:text-stone-400">Maximum images reached</p>
                  ) : (
                    <>
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-green-800 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-800">
                        <span className="px-1">Upload files</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          multiple
                          accept="image/jpeg,image/png,image/webp,video/mp4"
                          disabled={mediaPreviews.length >= MAX_IMAGES}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </>
                  )}
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-500">
                  JPEG, PNG, WEBP, MP4 up to 10MB each
                </p>
              </div>
            </div>

            {/* Previews with remove button */}
            {mediaPreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-in fade-in">
                {mediaPreviews.map((preview, index) => (
                  <div key={preview.url} className="relative group aspect-square rounded-xl overflow-hidden bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 shadow-sm">
                    {preview.type.startsWith("image/") ? (
                      <img src={preview.url} alt={preview.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <video src={preview.url} className="w-full h-full object-cover" muted playsInline />
                    )}

                    {/* Hover overlay for deletion */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemovePreview(index)}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-all"
                        aria-label="Remove file"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Index badge */}
                    <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-xs font-sans font-medium px-1.5 py-0.5 rounded-md">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Submit Actions */}
        <div className="pt-4 flex flex-col gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-14 w-full rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-sans text-lg font-medium transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isUploading ? "Uploading Media..." : "Publishing Listing..."}
              </>
            ) : (
              "Publish Listing"
            )}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="h-12 w-full rounded-xl bg-transparent border-2 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-sans font-medium hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
