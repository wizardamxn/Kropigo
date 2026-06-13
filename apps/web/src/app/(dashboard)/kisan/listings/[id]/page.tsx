"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  useGetListingByIdQuery,
  useUpdateListingMutation,
  useDeleteListingMutation,
} from "@/store/endpoints/listingsApi";
import { useGetCropsQuery } from "@/store/endpoints/cropsApi";
import { useGetMandiRatesQuery } from "@/store/endpoints/mandiApi";
import {
  useDeleteCloudinaryMediaMutation,
  useGetCloudinarySignatureMutation,
} from "@/store/endpoints/mediaApi";
import { uploadListingMedia, validateMediaFiles } from "@/lib/cloudinaryUpload";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormField } from "@/components/shared/FormField";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  AlertTriangle, 
  ArrowLeft, 
  Eye, 
  Info, 
  TrendingUp, 
  MapPin, 
  ImageIcon, 
  Video, 
  Trash2, 
  ExternalLink, 
  UploadCloud 
} from "lucide-react";

const UNITS = ["kg", "quintal", "ton"];
const EDITABLE_STATUSES = ["draft", "open"];
type MediaPreview = { url: string; name: string; type: string };

const updateListingFormSchema = z.object({
  unit: z.enum(['kg', 'quintal', 'ton'], { message: 'Please select a unit' }),
  quantity: z.string().min(1, 'Quantity is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    { message: 'Quantity must be greater than 0' }
  ),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  farmAddress: z.string().min(1, 'Farm address is required').max(500, 'Address cannot exceed 500 characters'),
  farmState: z.string().min(1, 'State is required').max(100, 'State cannot exceed 100 characters'),
  farmDistrict: z.string().min(1, 'District is required').max(100, 'District cannot exceed 100 characters'),
});

type UpdateListingFormValues = z.infer<typeof updateListingFormSchema>;

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError } = useGetListingByIdQuery(id);
  const { data: cropsData } = useGetCropsQuery();
  const [updateListing, { isLoading: isUpdating }] = useUpdateListingMutation();
  const [deleteListing, { isLoading: isDeleting }] = useDeleteListingMutation();
  const [getCloudinarySignature] = useGetCloudinarySignatureMutation();
  const [deleteCloudinaryMedia] = useDeleteCloudinaryMediaMutation();

  const listing = data?.data;
  const crops: any[] = cropsData?.data ?? [];

  const cropId = listing?.cropId?._id ?? listing?.cropId ?? "";
  const { data: mandiData } = useGetMandiRatesQuery(cropId, { skip: !cropId });
  const latestRate = mandiData?.data?.[0];

  const [removedMediaUrls, setRemovedMediaUrls] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState<{ index: number; progress: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [mediaPreviews, setMediaPreviews] = useState<MediaPreview[]>([]);
  const isSubmitting = isUpdating || isUploading;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<UpdateListingFormValues>({
    resolver: zodResolver(updateListingFormSchema),
    defaultValues: {
      unit: 'kg',
      quantity: '',
      description: '',
      farmAddress: '',
      farmState: '',
      farmDistrict: '',
    },
    mode: 'onTouched',
  });

  const unit = watch('unit');
  const description = watch('description') || '';

  useEffect(() => {
    if (!listing) return;
    reset({
      quantity: String(listing.quantity),
      unit: listing.unit,
      description: listing.description ?? "",
      farmAddress: listing.farmAddress,
      farmState: listing.farmState,
      farmDistrict: listing.farmDistrict,
    });
  }, [listing, reset]);

  // Redirect if listing doesn't belong to this kisan
  useEffect(() => {
    if (!listing || !user) return;
    const sellerId = listing.sellerId?._id ?? listing.sellerId;
    if (sellerId !== user.id) router.replace("/kisan/listings");
  }, [listing, user, router]);

  useEffect(() => {
    return () => {
      mediaPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [mediaPreviews]);

  const handleRemoveMedia = (url: string) => {
    setRemovedMediaUrls((prev) => [...prev, url]);
  };

  const handleFileChange = () => {
    const files = fileInputRef.current?.files;
    const remainingMedia = (listing?.mediaUrls ?? []).filter(
      (u: string) => !removedMediaUrls.includes(u),
    );
    setError("");

    if (!files || files.length === 0) {
      setMediaPreviews([]);
      return;
    }

    try {
      const selectedFiles = validateMediaFiles(files, remainingMedia.length);
      setMediaPreviews(
        selectedFiles.map((file) => ({
          url: URL.createObjectURL(file),
          name: file.name,
          type: file.type,
        })),
      );
    } catch (err: any) {
      setMediaPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setError(err?.message ?? "Invalid media selection.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const onSubmit = async (data: UpdateListingFormValues) => {
    setError("");
    setUploadProgress(null);
    const uploadedMediaUrls: string[] = [];

    const remainingMedia = (listing?.mediaUrls ?? []).filter(
      (u: string) => !removedMediaUrls.includes(u),
    );

    try {
      setIsUploading(true);
      const mediaUrls = await uploadListingMedia(
        fileInputRef.current?.files,
        () => getCloudinarySignature().unwrap(),
        remainingMedia.length,
        (url) => uploadedMediaUrls.push(url),
        (index, pct) => {
          setUploadProgress({ index, progress: pct });
        }
      );

      await updateListing({
        id,
        body: {
          quantity: data.quantity,
          unit: data.unit,
          description: data.description,
          farmAddress: data.farmAddress,
          farmState: data.farmState,
          farmDistrict: data.farmDistrict,
          deletedMediaUrls: removedMediaUrls,
          mediaUrls,
        },
      }).unwrap();
      toast.success("Listing updated successfully!");
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
          "Failed to update listing. Please try again.",
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteListing(id).unwrap();
      toast.success("Listing deleted successfully!");
      router.push("/kisan/listings");
    } catch (err: any) {
      setError(err?.data?.message ?? "Failed to delete listing.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-6">
        <div className="h-8 bg-stone-200 dark:bg-stone-800 rounded-lg w-24 mb-6"></div>
        <div className="h-12 bg-stone-200 dark:bg-stone-800 rounded-xl w-3/4"></div>
        <div className="h-64 bg-stone-200 dark:bg-stone-800 rounded-2xl w-full"></div>
        <div className="h-64 bg-stone-200 dark:bg-stone-800 rounded-2xl w-full"></div>
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="max-w-3xl mx-auto p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex flex-col items-center text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500 dark:text-red-400" />
        <p className="font-sans text-lg text-red-800 dark:text-red-300 font-medium">
          Listing not found or access denied.
        </p>
        <Link
          href="/kisan/listings"
          className="h-12 px-6 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-xl shadow-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors flex items-center"
        >
          Return to Listings
        </Link>
      </div>
    );
  }

  const canEdit = EDITABLE_STATUSES.includes(listing.status);
  const existingMedia: string[] = (listing.mediaUrls ?? []).filter(
    (u: string) => !removedMediaUrls.includes(u),
  );

  const inputCls = `h-12 rounded-xl${!canEdit ? ' opacity-60 cursor-not-allowed' : ''}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24">
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Listing"
        description="Are you sure you want to delete this listing? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
        variant="destructive"
      />

      {/* Navigation & Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 font-sans text-sm font-medium transition-colors w-fit cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Listings
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
              {listing.cropId?.name ?? listing.cropId}
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <StatusBadge status={listing.status} />
              <span className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-sm font-sans">
                <Eye className="w-4 h-4" />
                {listing.viewCount || 0} views
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts & Insights */}
      {!canEdit && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-4 flex gap-3 shadow-sm">
          <Info className="w-6 h-6 text-blue-600 dark:text-blue-500 flex-shrink-0" />
          <div className="font-sans text-sm text-blue-800 dark:text-blue-300">
            <strong className="font-medium block mb-0.5">Read-Only Mode</strong>
            This listing is currently marked as{" "}
            <strong>{listing.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</strong>. Editing is disabled
            to preserve the record of the transaction.
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {latestRate && canEdit && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
          <div className="p-2 bg-white dark:bg-stone-800 rounded-full shadow-sm text-green-700 dark:text-green-500 mt-1">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-sans font-semibold text-green-900 dark:text-green-400 mb-1">
              Market Insight
            </h3>
            <p className="font-sans text-sm text-green-800 dark:text-green-300">
              Current Mandi rate ({latestRate.market}):{" "}
              <span className="font-mono text-base font-bold bg-green-200/50 dark:bg-green-800/50 px-2 py-0.5 rounded">
                ₹{latestRate.minPrice} – ₹{latestRate.maxPrice}
              </span>{" "}
              / {latestRate.unit}.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Pricing & Details */}
        <section className="bg-stone-50 dark:bg-stone-900 rounded-2xl p-5 md:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
          <h2 className="font-serif text-2xl text-stone-800 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-3">
            Crop Details & Pricing
          </h2>

          <div className="flex flex-col sm:flex-row gap-5">
            <div className="sm:w-1/3">
              <FormField
                id="unit"
                label="Unit *"
                error={errors.unit?.message}
              >
                <Select value={unit} onValueChange={(val) => setValue('unit', val as any, { shouldValidate: true })} disabled={!canEdit}>
                  <SelectTrigger id="unit" className={`h-12 w-full rounded-xl border px-4 font-sans focus:outline-none focus:ring-2 focus:ring-green-800 transition-all shadow-sm flex justify-between items-center ${canEdit ? "bg-white dark:bg-stone-950 border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 cursor-pointer" : "bg-stone-100 dark:bg-stone-900/50 border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 cursor-not-allowed"}`}>
                    <SelectValue placeholder="Select unit..." />
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
                label="Quantity *"
                error={errors.quantity?.message}
              >
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="any"
                  {...register('quantity')}
                  disabled={!canEdit}
                  className={inputCls}
                  aria-invalid={errors.quantity ? "true" : "false"}
                  aria-describedby={errors.quantity ? "quantity-error" : undefined}
                />
              </FormField>
            </div>
          </div>


          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 flex gap-2">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="font-sans text-sm text-amber-800 dark:text-amber-300">
              Pricing is managed by our team. Buyers submit their own offers which you can accept or reject.
            </p>
          </div>

          <FormField
            id="description"
            label="Description"
            error={errors.description?.message}
          >
            <Textarea
              id="description"
              maxLength={1000}
              rows={4}
              {...register('description')}
              disabled={!canEdit}
              className={`rounded-xl resize-y${!canEdit ? ' cursor-not-allowed opacity-60' : ''}`}
              aria-invalid={errors.description ? "true" : "false"}
              aria-describedby={errors.description ? "description-error" : undefined}
            />
            {canEdit && (
              <div className="text-right mt-1 text-xs text-stone-500 dark:text-stone-400 font-sans">
                {description.length}/1000
              </div>
            )}
          </FormField>
        </section>

        {/* Section 2: Location */}
        <section className="bg-stone-50 dark:bg-stone-900 rounded-2xl p-5 md:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
            <MapPin className="w-6 h-6 text-stone-500 dark:text-stone-400" />
            <h2 className="font-serif text-2xl text-stone-800 dark:text-stone-100">
              Pickup Location
            </h2>
          </div>

          <FormField
            id="farmAddress"
            label="Farm Address / Village *"
            error={errors.farmAddress?.message}
          >
            <Input
              id="farmAddress"
              type="text"
              {...register('farmAddress')}
              disabled={!canEdit}
              className={inputCls}
              aria-invalid={errors.farmAddress ? "true" : "false"}
              aria-describedby={errors.farmAddress ? "farmAddress-error" : undefined}
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField
              id="farmDistrict"
              label="District *"
              error={errors.farmDistrict?.message}
            >
              <Input
                id="farmDistrict"
                type="text"
                {...register('farmDistrict')}
                disabled={!canEdit}
                className={inputCls}
                aria-invalid={errors.farmDistrict ? "true" : "false"}
                aria-describedby={errors.farmDistrict ? "farmDistrict-error" : undefined}
              />
            </FormField>
            <FormField
              id="farmState"
              label="State *"
              error={errors.farmState?.message}
            >
              <Input
                id="farmState"
                type="text"
                {...register('farmState')}
                disabled={!canEdit}
                className={inputCls}
                aria-invalid={errors.farmState ? "true" : "false"}
                aria-describedby={errors.farmState ? "farmState-error" : undefined}
              />
            </FormField>
          </div>
        </section>

        {/* Section 3: Media */}
        {(existingMedia.length > 0 || canEdit) && (
          <section className="bg-stone-50 dark:bg-stone-900 rounded-2xl p-5 md:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
              <ImageIcon className="w-6 h-6 text-stone-500 dark:text-stone-400" />
              <h2 className="font-serif text-2xl text-stone-800 dark:text-stone-100">
                Media Files
              </h2>
            </div>

            {/* Existing Media Gallery */}
            {existingMedia.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {existingMedia.map((url) => {
                  const isVideo = url.match(/\.(mp4|webm)$/i);
                  return (
                    <div
                      key={url}
                      className="relative group aspect-square rounded-xl overflow-hidden bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 shadow-sm"
                    >
                      {isVideo ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-stone-800 text-stone-400 p-4 text-center">
                          <Video className="w-8 h-8 mb-2" />
                          <span className="text-xs break-all">
                            {url.split("/").pop()}
                          </span>
                        </div>
                      ) : (
                        <Image
                          src={url}
                          alt="Crop"
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      )}

                      {/* Hover Overlay for Deletion */}
                      {canEdit && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(url)}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-all cursor-pointer"
                            aria-label="Remove image"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                      {/* View Link (always visible) */}
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-2 left-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}

            {/* New Media Upload */}
            {canEdit && existingMedia.length < 6 && (
              <div>
                <label className="block font-sans text-sm font-medium text-stone-850 dark:text-stone-300 mb-1.5 ml-1">
                  Add New Media (Up to {6 - existingMedia.length} more)
                </label>
                <div className="mt-2 flex justify-center px-6 py-8 border-2 border-stone-300 dark:border-stone-700 border-dashed rounded-xl bg-white dark:bg-stone-950 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors">
                  <div className="space-y-2 text-center flex flex-col items-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-stone-400 dark:text-stone-500" />
                    <div className="flex text-sm text-stone-600 dark:text-stone-400">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-transparent rounded-md font-medium text-green-800 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 focus-within:outline-none"
                      >
                        <span className="px-1">Select files</span>
                        <input
                          id="file-upload"
                          type="file"
                          className="sr-only"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          multiple
                          accept="image/jpeg,image/png,image/webp,video/mp4"
                        />
                      </label>
                      <p className="pl-1">to append to this listing</p>
                    </div>
                  </div>
                </div>
                {mediaPreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {mediaPreviews.map((preview) => (
                      <div
                        key={preview.url}
                        className="aspect-square rounded-xl overflow-hidden bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 shadow-sm"
                      >
                        {preview.type.startsWith("image/") ? (
                          <img
                            src={preview.url}
                            alt={preview.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={preview.url}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {uploadProgress && (
          <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm space-y-3 animate-in fade-in">
            <div className="flex justify-between font-sans text-sm font-semibold text-stone-800 dark:text-stone-150">
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin h-4 w-4 text-green-700 dark:text-green-500" />
                Processing file {uploadProgress.index + 1}...
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
              Optimizing media quality and compressing video frames to 720p. Please keep this tab active.
            </p>
          </div>
        )}

        {/* Action Buttons (Visible only if editable) */}
        {canEdit && (
          <div className="pt-6 flex flex-col md:flex-row gap-4 border-t border-stone-200 dark:border-stone-800">
            <Button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="flex-1 h-14 rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-sans text-lg font-medium shadow-md flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 text-white" />
                  {isUploading ? "Uploading Media..." : "Saving Changes..."}
                </>
              ) : "Save Changes"}
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting || isSubmitting}
              className="md:w-1/3 h-14 rounded-xl cursor-pointer flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              {isDeleting ? "Deleting..." : "Delete Listing"}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
