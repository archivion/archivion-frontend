import { type NextRequest, NextResponse } from "next/server"
import { Storage } from "@google-cloud/storage"
import { Firestore } from "@google-cloud/firestore"

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
})

const firestore = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
  databaseId: process.env.FIRESTORE_DATABASE_ID || "dbtubesltka2425", // Use environment variable or default
})

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || "tubesltka2425"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: fileId } = await params

    console.log(`Deleting file with ID: ${fileId}`)

    // The fileId IS the fileName with timestamp (bucket fileName)
    // So we can use it directly to delete from bucket
    const bucketFileName = fileId

    console.log(`Attempting to delete from bucket: ${bucketFileName}`)

    // Delete file from GCS bucket using the timestamp-prefixed filename
    const bucket = storage.bucket(BUCKET_NAME)
    const file = bucket.file(bucketFileName)

    try {
      await file.delete()
      console.log(`File deleted from bucket: ${bucketFileName}`)
    } catch (error) {
      console.warn(`File not found in bucket: ${bucketFileName}`, error)
      // Continue with metadata deletion even if GCS deletion fails
    }

    // Also try to delete metadata from Firestore if it exists
    try {
      const metadataQuery = await firestore
        .collection("media_metadata")
        .where("fileName", "==", bucketFileName)
        .limit(1)
        .get()

      if (!metadataQuery.empty) {
        const metadataDoc = metadataQuery.docs[0]
        await metadataDoc.ref.delete()
        console.log(`Metadata deleted from Firestore: ${metadataDoc.id}`)
      }
    } catch (metadataError) {
      console.warn("Error deleting metadata:", metadataError)
      // Continue even if metadata deletion fails
    }

    console.log(`File deletion completed: ${fileId}`)

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: fileId } = await params

    console.log(`Fetching file details for: ${fileId}`)

    // The fileId IS the fileName with timestamp (bucket fileName)
    const bucketFileName = fileId

    // Generate signed URL for download
    const bucket = storage.bucket(BUCKET_NAME)
    const file = bucket.file(bucketFileName)

    // Get file metadata
    const [metadata] = await file.getMetadata()
    const originalName = metadata.metadata?.originalName || bucketFileName

    const [downloadUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    })

    // Determine file type
    const contentType = metadata.contentType || ""
    let fileType = "unknown"
    if (contentType.startsWith("image/")) fileType = "image"
    else if (contentType.startsWith("video/")) fileType = "video"
    else if (contentType.startsWith("audio/")) fileType = "audio"

    return NextResponse.json({
      success: true,
      file: {
        id: bucketFileName,
        name: originalName,
        fileName: bucketFileName,
        fileType: fileType,
        size: Number.parseInt(metadata.size),
        contentType: metadata.contentType,
        createdAt: metadata.timeCreated,
        downloadUrl: downloadUrl,
        previewUrl: fileType === "image" ? downloadUrl : null,
        publicUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${bucketFileName}`,
      },
    })
  } catch (error) {
    console.error("Error fetching file:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
