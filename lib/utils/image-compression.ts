/**
 * Utility untuk kompresi dan optimasi gambar banner otomatis di sisi klien (browser).
 * Mengubah resolusi ke ukuran ideal mobile (maks. lebar 1200px) dan encoding ke WebP kualitas tinggi.
 */

export interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  savedPercent: number
  width: number
  height: number
}

/**
 * Format bytes ke string yang mudah dibaca (KB / MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

/**
 * Kompresi gambar untuk kebutuhan banner PWA mobile
 * @param file File gambar asli dari input
 * @param maxWidth Batas lebar maksimal (default 1200px)
 * @param maxHeight Batas tinggi maksimal (default 600px)
 * @param quality Kualitas kompresi WebP (0.82)
 */
export async function compressImageForMobile(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 600,
  quality: number = 0.82
): Promise<CompressionResult> {
  // Jika bukan gambar atau merupakan GIF animasi, jangan dikompres agar animasinya tidak hilang
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      savedPercent: 0,
      width: 0,
      height: 0,
    }
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        let width = img.naturalWidth || img.width
        let height = img.naturalHeight || img.height

        // Pertahankan rasio aspek dan sesuaikan jika melebihi batas maksimal
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          resolve({
            file,
            originalSize: file.size,
            compressedSize: file.size,
            savedPercent: 0,
            width,
            height,
          })
          return
        }

        // Aktifkan smoothing berkualitas tinggi untuk hasil gambar yang tajam
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(img, 0, 0, width, height)

        // Konversi ke format WebP (modern, super hemat, kompatibel di semua peramban modern)
        const mimeType = "image/webp"
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({
                file,
                originalSize: file.size,
                compressedSize: file.size,
                savedPercent: 0,
                width,
                height,
              })
              return
            }

            const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp"
            const compressedFile = new File([blob], newFileName, {
              type: mimeType,
              lastModified: Date.now(),
            })

            // Jika hasil kompresi lebih hemat, pakai yang terkompresi
            const finalFile = compressedFile.size < file.size ? compressedFile : file
            const savedBytes = Math.max(0, file.size - finalFile.size)
            const savedPercent = Math.round((savedBytes / file.size) * 100)

            resolve({
              file: finalFile,
              originalSize: file.size,
              compressedSize: finalFile.size,
              savedPercent,
              width,
              height,
            })
          },
          mimeType,
          quality
        )
      }
      img.onerror = () => {
        resolve({
          file,
          originalSize: file.size,
          compressedSize: file.size,
          savedPercent: 0,
          width: 0,
          height: 0,
        })
      }
    }
    reader.onerror = () => {
      resolve({
        file,
        originalSize: file.size,
        compressedSize: file.size,
        savedPercent: 0,
        width: 0,
        height: 0,
      })
    }
  })
}
