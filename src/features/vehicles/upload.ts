"use client"

import type { SignedUploadDto } from "./types"

/**
 * PUTs a file to a Supabase signed upload URL (the token is already in the
 * URL's query string), the same way supabase-js `uploadToSignedUrl` does.
 * XHR rather than fetch so we can report progress.
 */
export function putToSignedUrl(
  ticket: SignedUploadDto,
  file: File,
  onProgress?: (fraction: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const body = new FormData()
    body.append("cacheControl", "3600")
    body.append("", file)

    const xhr = new XMLHttpRequest()
    xhr.open("PUT", ticket.uploadUrl)
    xhr.setRequestHeader("x-upsert", "false")
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total)
    }
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status})`))
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection."))
    xhr.send(body)
  })
}

export function checkFile(
  file: File,
  allowedTypes: readonly string[],
  maxBytes: number
): string | null {
  if (!allowedTypes.includes(file.type)) {
    return `${file.name}: unsupported file type`
  }
  if (file.size > maxBytes) {
    return `${file.name}: larger than ${Math.round(maxBytes / 1024 / 1024)} MB`
  }
  return null
}
