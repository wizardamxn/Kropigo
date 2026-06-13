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
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormField } from "@/components/shared/FormField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const UNITS = ["kg", "quintal", "ton"];
const MAX_IMAGES = 6;
type MediaPreview = { url: string; name: string; type: string };

const createListingFormSchema = z.object({
  cropId: z.string().min(1, 'Please select a crop'),
  variety: z.string().max(100, 'Variety cannot exceed 100 characters').optional(),
  unit: z.enum(['kg', 'quintal', 'ton'], { message: 'Please select a unit' }),
  quantity: z.string().min(1, 'Quantity is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    { message: 'Quantity must be greater than 0' }
  ),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  farmAddress: z.string().min(1, 'Farm address is required').max(500, 'Address cannot exceed 500 characters'),
  farmState: z.string().min(1, 'State is required').max(100, 'State cannot exceed 100 characters'),
  farmDistrict: z.string().min(1, 'District is required').max(100, 'District cannot exceed 100 characters'),
  lat: z.string().optional(),
  lng: z.string().optional(),
});

type CreateListingFormValues = z.infer<typeof createListingFormSchema>;

export default function CreateListing() {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mediaPreviewsRef = useRef<MediaPreview[]>([]);

  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<MediaPreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ index: number; progress: number } | null>(null);
  const t = useTranslations("kisanCreateListing");
  const tCommon = useTranslations("common");

  const [createListing, { isLoading }] = useCreateListingMutation();
  const [getCloudinarySignature] = useGetCloudinarySignatureMutation();
  const [deleteCloudinaryMedia] = useDeleteCloudinaryMediaMutation();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateListingFormValues>({
    resolver: zodResolver(createListingFormSchema),
    defaultValues: {
      cropId: "",
      variety: "",
      unit: undefined,
      quantity: "",
      description: "",
      farmAddress: "",
      farmState: "",
      farmDistrict: "",
      lat: "",
      lng: "",
    },
    mode: "onTouched",
  });

  const cropId = watch("cropId");
  const unit = watch("unit");
  const description = watch("description") || "";

  const { data: mandiData } = useGetMandiRatesQuery(cropId, { skip: !cropId });
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
      setError(err?.message ?? t("invalidMedia"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleRemovePreview = (indexToRemove: number) => {
    URL.revokeObjectURL(mediaPreviews[indexToRemove].url);
    setMediaPreviews((prev) => prev.filter((_, i) => i !== indexToRemove));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const onSubmit = async (data: CreateListingFormValues) => {
    setError("");
    setUploadProgress(null);
    const uploadedMediaUrls: string[] = [];

    try {
      setIsUploading(true);
      const mediaUrls = await uploadListingMedia(
        selectedFiles,
        () => getCloudinarySignature().unwrap(),
        0,
        (url) => uploadedMediaUrls.push(url),
        (index, pct) => {
          setUploadProgress({ index, progress: pct });
        }
      );

      await createListing({
        cropId: data.cropId,
        variety: data.variety || undefined,
        quantity: data.quantity,
        unit: data.unit,
        description: data.description,
        farmAddress: data.farmAddress,
        farmState: data.farmState,
        farmDistrict: data.farmDistrict,
        lat: data.lat || undefined,
        lng: data.lng || undefined,
        mediaUrls,
      }).unwrap();

      toast.success("Listing created successfully!");
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
          t("failedToCreate")
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-12">

      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
          {t("title")}
        </h1>
        <p className="font-sans text-stone-600 dark:text-stone-400 mt-2 text-lg">
          {t("subtitle")}
        </p>
      </div>

      {/* Time Constraint Warning */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 flex gap-3 shadow-sm">
        <svg className="w-6 h-6 text-amber-600 dark:text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="font-sans text-sm text-amber-800 dark:text-amber-300">
          <strong className="font-medium block mb-0.5">{t("marketHoursNotice")}</strong>
          {t("marketHoursDesc")}{" "}
          <span className="font-semibold">{t("marketHoursTime")}</span>.
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="animate-in slide-in-from-top-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Section 1: Crop Details */}
        <section className="bg-stone-50 dark:bg-stone-900 rounded-2xl p-5 md:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
          <h2 className="font-serif text-2xl text-stone-800 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-3">
            {t("cropDetails")}
          </h2>

          <div className="flex flex-col gap-1.5">
            <CropSelector
              cropId={cropId}
              setCropId={(id) => setValue('cropId', id, { shouldValidate: true })}
            />
            {errors.cropId && (
              <p className="text-xs text-red-500 font-sans ml-1 mt-0.5 animate-in fade-in" role="alert">
                {errors.cropId.message}
              </p>
            )}
          </div>

          <FormField
            id="variety"
            label={t("variety")}
            error={errors.variety?.message}
          >
            <Input
              id="variety"
              type="text"
              {...register('variety')}
              placeholder={t("varietyPlaceholder")}
              className="h-12 rounded-xl"
              aria-invalid={errors.variety ? "true" : "false"}
              aria-describedby={errors.variety ? "variety-error" : undefined}
            />
          </FormField>

          <div className="flex flex-col sm:flex-row gap-5">
            <div className="sm:w-1/3">
              <FormField
                id="unit"
                label={t("unit")}
                error={errors.unit?.message}
                required
              >
                <Select value={unit} onValueChange={(val) => setValue('unit', val as any, { shouldValidate: true })}>
                  <SelectTrigger id="unit" className="h-12 w-full rounded-xl bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 px-4 font-sans focus:outline-none focus:ring-2 focus:ring-green-800 dark:focus:ring-green-700 transition-all shadow-sm cursor-pointer flex justify-between items-center">
                    <SelectValue placeholder={t("selectUnit")} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-1 shadow-md">
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u} className="px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer">
                        {u.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <div className="flex-1">
              <FormField
                id="quantity"
                label={t("quantity")}
                error={errors.quantity?.message}
                required
              >
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="any"
                  {...register('quantity')}
                  placeholder={unit ? `e.g. 50 ${unit}` : t("selectUnitFirst")}
                  disabled={!unit}
                  className={`h-12 rounded-xl${!unit ? ' opacity-60 cursor-not-allowed' : ''}`}
                  aria-invalid={errors.quantity ? "true" : "false"}
                  aria-describedby={errors.quantity ? "quantity-error" : undefined}
                />
              </FormField>
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
                {t("marketInsight")}
              </h3>
              <p className="font-sans text-sm text-green-800 dark:text-green-300 leading-relaxed">
                {t("mandiRateMsgPart1")} <strong>{latestRate.market}</strong> {t("mandiRateMsgPart2")}{" "}
                <br className="hidden sm:block" />
                <span className="font-mono text-base font-bold bg-green-200/50 dark:bg-green-800/50 px-2 py-0.5 rounded">
                  ₹{latestRate.minPrice} – ₹{latestRate.maxPrice}
                </span>{" "}
                / {latestRate.unit}.
              </p>
            </div>
          </div>
        )}

        {/* Section 2: Description */}
        <section className="bg-stone-50 dark:bg-stone-900 rounded-2xl p-5 md:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
          <h2 className="font-serif text-2xl text-stone-800 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-3">
            {t("additionalDetails")}
          </h2>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 flex gap-2">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-sans text-sm text-amber-800 dark:text-amber-300">
              {t("pricingNotice")}
            </p>
          </div>

          <FormField
            id="description"
            label={t("descriptionLabel")}
            error={errors.description?.message}
          >
            <Textarea
              id="description"
              maxLength={1000}
              rows={4}
              {...register('description')}
              placeholder={t("descriptionPlaceholder")}
              className="rounded-xl resize-y"
              aria-invalid={errors.description ? "true" : "false"}
              aria-describedby={errors.description ? "description-error" : undefined}
            />
            <div className="text-right mt-1 text-xs text-stone-500 dark:text-stone-400 font-sans">
              {description.length}/1000
            </div>
          </FormField>
        </section>

        {/* Section 3: Location */}
        <section className="bg-stone-50 dark:bg-stone-900 rounded-2xl p-5 md:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
            <svg className="w-6 h-6 text-stone-500 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="font-serif text-2xl text-stone-800 dark:text-stone-100">
              {t("pickupLocation")}
            </h2>
          </div>

          <div className="space-y-2">
            <LocationPicker
              lat={watch('lat') || ""}
              lng={watch('lng') || ""}
              farmAddress={watch('farmAddress') || ""}
              farmDistrict={watch('farmDistrict') || ""}
              farmState={watch('farmState') || ""}
              onChange={({ lat: l, lng: ln, farmAddress: fa, farmDistrict: fd, farmState: fs }) => {
                setValue('lat', l, { shouldValidate: true });
                setValue('lng', ln, { shouldValidate: true });
                setValue('farmAddress', fa, { shouldValidate: true });
                setValue('farmDistrict', fd, { shouldValidate: true });
                setValue('farmState', fs, { shouldValidate: true });
              }}
              disabled={isSubmitting}
            />
            {(errors.farmAddress || errors.farmDistrict || errors.farmState) && (
              <div className="text-xs text-red-500 font-sans ml-1 space-y-0.5 animate-in fade-in" role="alert">
                {errors.farmAddress && <p>{errors.farmAddress.message}</p>}
                {errors.farmDistrict && <p>{errors.farmDistrict.message}</p>}
                {errors.farmState && <p>{errors.farmState.message}</p>}
              </div>
            )}
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
                {t("mediaFiles")}
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
              <label className="block font-sans text-sm font-medium text-stone-800 dark:text-stone-300 mb-1.5 ml-1">{t("photos")}</label>
              <button
                type="button"
                disabled={mediaPreviews.length >= MAX_IMAGES || isSubmitting}
                onClick={() => imageInputRef.current?.click()}
                className={`w-full flex flex-col items-center justify-center gap-3 px-6 py-7 border-2 border-dashed rounded-xl transition-colors ${
                  mediaPreviews.length >= MAX_IMAGES || isSubmitting
                    ? "border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950 opacity-50 cursor-not-allowed"
                    : "border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 hover:border-green-600 dark:hover:border-green-700 hover:bg-green-50/40 dark:hover:bg-green-900/10 cursor-pointer"
                }`}
              >
                <div className="p-3 rounded-full bg-stone-100 dark:bg-stone-800">
                  <svg className="w-6 h-6 text-stone-500 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-sans text-sm font-medium text-stone-700 dark:text-stone-300">{t("addPhotos")}</p>
                  <p className="font-sans text-xs text-stone-500 dark:text-stone-500 mt-0.5">{t("photosSpec")}</p>
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
              <label className="block font-sans text-sm font-medium text-stone-800 dark:text-stone-300 mb-1.5 ml-1">{t("video")}</label>
              <button
                type="button"
                disabled={mediaPreviews.length >= MAX_IMAGES || isSubmitting}
                onClick={() => videoInputRef.current?.click()}
                className={`w-full flex flex-col items-center justify-center gap-3 px-6 py-7 border-2 border-dashed rounded-xl transition-colors ${
                  mediaPreviews.length >= MAX_IMAGES || isSubmitting
                    ? "border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950 opacity-50 cursor-not-allowed"
                    : "border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 hover:border-green-600 dark:hover:border-green-700 hover:bg-green-50/40 dark:hover:bg-green-900/10 cursor-pointer"
                }`}
              >
                <div className="p-3 rounded-full bg-stone-100 dark:bg-stone-800">
                  <svg className="w-6 h-6 text-stone-500 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-sans text-sm font-medium text-stone-700 dark:text-stone-300">{t("addVideo")}</p>
                  <p className="font-sans text-xs text-stone-500 dark:text-stone-500 mt-0.5">{t("videoSpec")}</p>
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
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-all cursor-pointer"
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

        {uploadProgress && (
          <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm space-y-3 animate-in fade-in">
            <div className="flex justify-between font-sans text-sm font-semibold text-stone-800 dark:text-stone-100">
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin h-4 w-4 text-green-700 dark:text-green-500" />
                {t("processingFile", { current: uploadProgress.index + 1, total: selectedFiles.length })}
              </span>
              <span>{uploadProgress.progress}%</span>
            </div>
            <div className="w-full bg-stone-200 dark:bg-stone-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-green-700 dark:bg-green-600 h-full transition-all duration-150 rounded-full" 
                style={{ width: `${uploadProgress.progress}%` }} 
              />
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
              {t("optimizingMedia")}
            </p>
          </div>
        )}

        {/* Submit Actions */}
        <div className="pt-4 flex flex-col gap-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="h-14 w-full rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-sans text-lg font-medium shadow-md flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 text-white" />
                {isUploading ? t("uploadingMedia") : t("publishingListing")}
              </>
            ) : (
              t("publishListing")
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="h-12 w-full rounded-xl"
          >
            {tCommon("cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
}
