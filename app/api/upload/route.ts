import { type NextRequest, NextResponse } from "next/server"
import { Storage } from "@google-cloud/storage"

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
})

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || "tubesltka2425"

// Allowed file extensions
const ALLOWED_EXTENSIONS = {
  audio: [".mp3", ".wav", ".flac"],
  video: [".mp4", ".avi", ".mov", ".mkv"],
  image: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (100MB limit)
    const MAX_SIZE = 100 * 1024 * 1024 // 100MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds 100MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB` },
        { status: 400 },
      )
    }

    // Validate file extension
    const fileName = file.name.toLowerCase()
    const fileExt = fileName.substring(fileName.lastIndexOf("."))

    let fileType = "unknown"
    let isAllowed = false

    if (ALLOWED_EXTENSIONS.audio.includes(fileExt)) {
      fileType = "audio"
      isAllowed = true
    } else if (ALLOWED_EXTENSIONS.video.includes(fileExt)) {
      fileType = "video"
      isAllowed = true
    } else if (ALLOWED_EXTENSIONS.image.includes(fileExt)) {
      fileType = "image"
      isAllowed = true
    }

    if (!isAllowed) {
      return NextResponse.json(
        {
          error: `File type not allowed. Allowed extensions: 
          Images: ${ALLOWED_EXTENSIONS.image.join(", ")}
          Videos: ${ALLOWED_EXTENSIONS.video.join(", ")}
          Audio: ${ALLOWED_EXTENSIONS.audio.join(", ")}`,
        },
        { status: 400 },
      )
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const fileName_withTimestamp = `${timestamp}-${sanitizedName}`

    console.log(`Uploading file: ${fileName_withTimestamp} (${file.size} bytes)`)

    // Get bucket reference
    const bucket = storage.bucket(BUCKET_NAME)
    const fileRef = bucket.file(fileName_withTimestamp)

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload file to GCS
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      },
    })

    console.log(`File uploaded successfully: ${fileName_withTimestamp}`)

    // Generate signed URLs for immediate access
    const [downloadUrl] = await fileRef.getSignedUrl({
      action: "read",
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    })

    // Return success response with URLs for immediate use
    return NextResponse.json({
      success: true,
      file: {
        id: fileName_withTimestamp,
        name: file.name,
        fileName: fileName_withTimestamp,
        size: file.size,
        contentType: file.type,
        fileType: fileType,
        status: "uploaded",
        createdAt: new Date().toISOString(),
        downloadUrl: downloadUrl,
        previewUrl: fileType === "image" ? downloadUrl : null,
        publicUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${fileName_withTimestamp}`,
      },
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
