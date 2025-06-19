import { type NextRequest, NextResponse } from "next/server"
import { Storage } from "@google-cloud/storage"

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
})

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || "tubesltka2425"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: fileId } = await params

    console.log(`Downloading file: ${fileId}`)

    // The fileId IS the fileName with timestamp (bucket fileName)
    const bucketFileName = fileId

    // Get file from bucket
    const bucket = storage.bucket(BUCKET_NAME)
    const file = bucket.file(bucketFileName)

    // Get file metadata to get original name
    const [metadata] = await file.getMetadata()
    const originalName = metadata.metadata?.originalName || bucketFileName

    // Get file stream
    const [fileBuffer] = await file.download()

    // Set headers for download
    const headers = new Headers()
    headers.set("Content-Disposition", `attachment; filename="${originalName}"`)
    headers.set("Content-Type", metadata.contentType || "application/octet-stream")
    headers.set("Content-Length", metadata.size.toString())

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json(
      {
        error: "Failed to download file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
