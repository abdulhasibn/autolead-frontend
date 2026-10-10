"use client";

import { useState } from "react";
import Link from "next/link";
import { Camera, Images } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VehicleMediaDto } from "../types";
import { orderPhotos, photoCaption } from "../utils";
import { PhotoLightbox, type LightboxPhoto } from "./photo-lightbox";

interface VehicleGalleryProps {
  media: VehicleMediaDto[];
  title: string;
  /** Where "Add photos" points when the vehicle has none. */
  photosHref: string;
  dimmed?: boolean;
}

/**
 * Bento hero: the cover large, two supporting shots and a "+N" tile that opens
 * the lightbox. Phones get the cover alone with a counter.
 */
export function VehicleGallery({
  media,
  title,
  photosHref,
  dimmed,
}: VehicleGalleryProps) {
  const [index, setIndex] = useState<number | null>(null);
  const ordered = orderPhotos(media);
  const photos: LightboxPhoto[] = ordered.map((m, i) => ({
    id: m.id,
    url: m.url,
    caption: photoCaption(m.category, i === 0 && m.category === "front"),
  }));

  if (photos.length === 0) {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-[#134E4A] via-[#0F766E] to-[#0D9488] text-white sm:h-[400px] lg:h-full lg:min-h-[400px]">
        <span className="flex size-12 items-center justify-center rounded-full bg-white/15">
          <Camera className="size-6" />
        </span>
        <div className="text-center">
          <p className="font-semibold">No photos yet</p>
          <p className="text-sm text-white/70">
            A front photo becomes the cover everywhere.
          </p>
        </div>
        <Link
          href={photosHref}
          className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-[#0F766E] hover:bg-[#F0FDFA]"
        >
          Add photos
        </Link>
      </div>
    );
  }

  const cover = photos[0]!;
  const side = photos.slice(1, 3);
  const extra = photos.length - 3;
  const imgClass = cn(
    "size-full object-cover transition duration-300",
    dimmed && "grayscale",
  );

  return (
    <>
      {/* On desktop the wrapper stretches to the summary column's height; the grid fills it absolutely so photos don't drive the size. */}
      <div className="relative h-[260px] sm:h-[400px] lg:h-auto lg:min-h-[400px]">
        <div
          className={cn(
            "grid h-full gap-2 overflow-hidden rounded-xl lg:absolute lg:inset-0",
            side.length > 0
              ? "grid-cols-1 sm:grid-cols-4 sm:grid-rows-2"
              : "grid-cols-1",
          )}
        >
          <button
            type="button"
            onClick={() => setIndex(0)}
            className={cn(
              "group relative overflow-hidden bg-[#0F172A]",
              side.length > 0 && "sm:col-span-3 sm:row-span-2",
            )}
            aria-label={`Open photos of ${title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover.url}
              alt={title}
              className={cn(imgClass, "group-hover:scale-[1.02]")}
            />
            <span className="absolute top-3 left-3 rounded-md bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
              {cover.caption}
            </span>
            {photos.length > 1 && (
              <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-md bg-black/55 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur sm:hidden">
                <Images className="size-3.5" />1 / {photos.length}
              </span>
            )}
          </button>

          {side.map((photo, i) => {
            const isLast = i === side.length - 1;
            const showMore = isLast && extra > 0;
            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => setIndex(i + 1)}
                className={cn(
                  "group relative hidden overflow-hidden bg-[#0F172A] sm:block",
                  side.length === 1 && "sm:row-span-2",
                )}
                aria-label={
                  showMore
                    ? `View all ${photos.length} photos`
                    : `Open ${photo.caption}`
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt=""
                  className={cn(imgClass, "group-hover:scale-105")}
                />
                {showMore ? (
                  <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
                    <span className="text-lg font-bold">+{extra}</span>
                    <span className="text-[11px]">View all photos</span>
                  </span>
                ) : (
                  <span className="absolute bottom-2 left-2 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                    {photo.caption}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <PhotoLightbox photos={photos} index={index} onIndexChange={setIndex} />
    </>
  );
}
