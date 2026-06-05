'use client';

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import CropSelector from "@/components/CropSelector";
import LocationPicker from "@/components/LocationPicker";
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
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mediaPreviewsRef = useRef<MediaPreview[]>([]);

  const [cropId, setCropId] = useState("");
  const [variety, setVariety] = useState("");
  const [unit, setUnit] = useState("");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [farmAddress, setFarmAddress] = useState("");
  const [farmState, setFarmState] = useState("");
  const [farmDistrict, setFarmDistrict] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
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

  const handleFileChange = (ref: React.RefObject<HTMLInputElement | null>) => {
    const files = ref.current?.files;
    setError("");

    if (!files || files.length === 0) return;

    try {
      const newFiles = validateMediaFiles(files, selectedFiles.length);
      const newPreviews = newFiles.map((file) => ({
        url: URL.createObjectURL(file),
        name: file.name,
        type: file.type,
      }));

      setSelectedFiles((prev) => [...prev, ...newFiles]);
      setMediaPreviews((prev) => [...prev, ...newPreviews]);

      if (ref.current) ref.current.value = "";
    } catch (err: any) {
      if (ref.current) ref.current.value = "";
      setError(err?.message ?? "Invalid media selection.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleRemovePreview = (indexToRemove: number) => {
    URL.revokeObjectURL(mediaPreviews[indexToRemove].url);
    setMediaPreviews((prev) => prev.filter((_, i) => i !== indexToRemove));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
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
            <div className="sm:w-1/3">
              <label className={labelBaseClass}>Unit *</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
                className={`${inputBaseClass} appearance-none cursor-pointer`}
              >
                <option value="" disabled>Select unit...</option>
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className={labelBaseClass}>Quantity *</label>
              <input
                type="number"
                min="0"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                placeholder={unit ? `e.g. 50 ${unit}` : "Select unit first"}
                disabled={!unit}
                className={`${inputBaseClass} ${!unit ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
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

        {/* Section 2: Description */}
        <section className="bg-stone-50 dark:bg-stone-900 rounded-2xl p-5 md:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
          <h2 className="font-serif text-2xl text-stone-800 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-3">
            Additional Details
          </h2>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 flex gap-2">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-sans text-sm text-amber-800 dark:text-amber-300">
              Pricing is determined by our team based on current market rates. Buyers will make offers that you can accept or reject.
            </p>
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

          <LocationPicker
            lat={lat}
            lng={lng}
            farmAddress={farmAddress}
            farmDistrict={farmDistrict}
            farmState={farmState}
            onChange={({ lat: l, lng: ln, farmAddress: fa, farmDistrict: fd, farmState: fs }) => {
              setLat(l);
              setLng(ln);
              setFarmAddress(fa);
              setFarmDistrict(fd);
              setFarmState(fs);
            }}
            disabled={isSubmitting}
          />
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
            <span className={`font-sans text-sm font-semibold px-3 py-1 rounded-full ${
              mediaPreviews.length >= MAX_IMAGES
                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                : "bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300"
            }`}>
              {mediaPreviews.length} / {MAX_IMAGES}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Photos upload */}
            <div>
              <label className={labelBaseClass}>Photos</label>
              <button
                type="button"
                disabled={mediaPreviews.length >= MAX_IMAGES || isSubmitting}
                onClick={() => imageInputRef.current?.click()}
                className={`w-full flex flex-col items-center justify-center gap-3 px-6 py-7 border-2 border-dashed rounded-xl transition-colors ${
                  mediaPreviews.length >= MAX_IMAGES || isSubmitting
                    ? "border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 opacity-50 cursor-not-allowed"
                    : "border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 hover:border-green-600 dark:hover:border-green-700 hover:bg-green-50/40 dark:hover:bg-green-900/10 cursor-pointer"
                }`}
              >
                <div className="p-3 rounded-full bg-stone-100 dark:bg-stone-800">
                  <svg className="w-6 h-6 text-stone-500 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-sans text-sm font-medium text-stone-700 dark:text-stone-300">Add Photos</p>
                  <p className="font-sans text-xs text-stone-500 dark:text-stone-500 mt-0.5">JPEG, PNG, WEBP · up to 100 MB</p>
                </div>
              </button>
              <input
                ref={imageInputRef}
                type="file"
                className="sr-only"
                onChange={() => handleFileChange(imageInputRef)}
                multiple
                accept="image/jpeg,image/png,image/webp"
                disabled={mediaPreviews.length >= MAX_IMAGES || isSubmitting}
              />
            </div>

            {/* Video upload */}
            <div>
              <label className={labelBaseClass}>Video</label>
              <button
                type="button"
                disabled={mediaPreviews.length >= MAX_IMAGES || isSubmitting}
                onClick={() => videoInputRef.current?.click()}
                className={`w-full flex flex-col items-center justify-center gap-3 px-6 py-7 border-2 border-dashed rounded-xl transition-colors ${
                  mediaPreviews.length >= MAX_IMAGES || isSubmitting
                    ? "border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 opacity-50 cursor-not-allowed"
                    : "border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 hover:border-green-600 dark:hover:border-green-700 hover:bg-green-50/40 dark:hover:bg-green-900/10 cursor-pointer"
                }`}
              >
                <div className="p-3 rounded-full bg-stone-100 dark:bg-stone-800">
                  <svg className="w-6 h-6 text-stone-500 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-sans text-sm font-medium text-stone-700 dark:text-stone-300">Add Video</p>
                  <p className="font-sans text-xs text-stone-500 dark:text-stone-500 mt-0.5">MP4 · up to 100 MB</p>
                </div>
              </button>
              <input
                ref={videoInputRef}
                type="file"
                className="sr-only"
                onChange={() => handleFileChange(videoInputRef)}
                accept="video/mp4"
                disabled={mediaPreviews.length >= MAX_IMAGES || isSubmitting}
              />
            </div>
          </div>

          {/* Previews */}
          {mediaPreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-in fade-in">
              {mediaPreviews.map((preview, index) => (
                <div key={preview.url} className="relative group aspect-square rounded-xl overflow-hidden bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 shadow-sm">
                  {preview.type.startsWith("image/") ? (
                    <img src={preview.url} alt={preview.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <video src={preview.url} className="w-full h-full object-cover" muted playsInline />
                  )}

                  {/* Type badge */}
                  <div className="absolute top-1.5 right-1.5 bg-black/60 text-white text-xs font-sans font-medium px-1.5 py-0.5 rounded-md">
                    {preview.type.startsWith("image/") ? "IMG" : "VID"}
                  </div>

                  {/* Hover overlay */}
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
