import { type NextRequest, NextResponse } from "next/server"
import { Storage } from "@google-cloud/storage"
import { Firestore } from "@google-cloud/firestore"

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
})

// Initialize Firestore with custom database ID
const firestore = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
  databaseId: process.env.FIRESTORE_DATABASE_ID || "dbtubesltka2425", // Use environment variable or default
})

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || "tubesltka2425"

// Helper function to get file type from content type
function getFileTypeFromContentType(contentType: string): "image" | "video" | "audio" | "unknown" {
  if (contentType.startsWith("image/")) return "image"
  if (contentType.startsWith("video/")) return "video"
  if (contentType.startsWith("audio/")) return "audio"
  return "unknown"
}

// Helper function to get thumbnail URL based on file type
function getThumbnailUrl(file: any, fileType: string): string {
  if (fileType === "image") {
    return file.publicUrl || file.mediaLink
  } else if (fileType === "video") {
    return "/video-thumbnail.jpg" // Default video thumbnail
  } else if (fileType === "audio") {
    return "/audio-thumbnail.jpg" // Default audio thumbnail
  }
  return "/placeholder.jpg" // Default placeholder
}

// Helper function to check if metadata exists in Firestore
async function getMetadataForFile(fileName: string): Promise<any> {
  try {
    console.log(`Checking metadata for fileName: ${fileName}`)

    // Query media_metadata collection by fileName (bucket name with timestamp prefix)
    const metadataQuery = await firestore.collection("media_metadata").where("fileName", "==", fileName).limit(1).get()

    if (!metadataQuery.empty) {
      const metadataDoc = metadataQuery.docs[0]
      const metadata = metadataDoc.data()
      console.log(`Found metadata for ${fileName}:`, metadata)
      return metadata
    }

    console.log(`No metadata found for fileName: ${fileName}`)
    return null
  } catch (error) {
    console.error(`Error checking metadata for ${fileName}:`, error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fileType = searchParams.get("fileType")
    const searchText = searchParams.get("searchText")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    console.log("Fetching files with params:", { fileType, searchText, limit, offset })

    // Get files from bucket
    const [files] = await storage.bucket(BUCKET_NAME).getFiles()

    console.log(`Found ${files.length} files in bucket ${BUCKET_NAME}`)

    // Get all metadata from Firestore in one query for efficiency
    const metadataSnapshot = await firestore.collection("media_metadata").get()
    const metadataMap = new Map()

    metadataSnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.fileName) {
        metadataMap.set(data.fileName, data)
      }
    })

    console.log(`Found ${metadataMap.size} metadata documents in Firestore`)

    // Process files and match with metadata
    let processedFiles = await Promise.all(
      files.map(async (file) => {
        try {
          const [metadata] = await file.getMetadata()

          // Extract original name from metadata if available
          const originalName = metadata.metadata?.originalName || file.name
          const bucketFileName = file.name // This is the fileName with timestamp prefix

          // Determine file type
          const contentType = metadata.contentType || ""
          const fileTypeFromContent = getFileTypeFromContentType(contentType)

          // Check if metadata exists in Firestore using bucket fileName
          const firestoreMetadata = metadataMap.get(bucketFileName)
          const hasMetadata = !!firestoreMetadata

          // Determine status based on metadata availability
          let status = "uploaded"
          if (hasMetadata) {
            status = "completed"
          } else {
            // Check file age - if older than 10 minutes and no metadata, might be processing
            const fileAge = Date.now() - new Date(metadata.timeCreated).getTime()
            const tenMinutes = 10 * 60 * 1000

            if (fileAge > tenMinutes) {
              status = "processing" // Still processing after 10 minutes
            } else {
              status = "uploaded" // Recently uploaded, processing expected
            }
          }

          // Generate signed URL for download
          const [downloadUrl] = await file.getSignedUrl({
            action: "read",
            expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          })

          // Get thumbnail URL based on file type
          const previewUrl = getThumbnailUrl(file, fileTypeFromContent)

          return {
            id: bucketFileName, // Use bucket fileName as ID
            name: originalName, // Display original name
            fileName: bucketFileName, // Store bucket fileName for metadata lookup
            fileType: fileTypeFromContent,
            size: Number.parseInt(metadata.size),
            contentType: metadata.contentType,
            status: status,
            createdAt: metadata.timeCreated,
            downloadUrl: downloadUrl,
            previewUrl: previewUrl,
            publicUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${bucketFileName}`,
            hasMetadata: hasMetadata,
            // Include AI analysis if metadata exists
            aiAnalysis: firestoreMetadata
              ? {
                  tags: firestoreMetadata.tags || firestoreMetadata.object_tags || [],
                  transcript: firestoreMetadata.transcription || "",
                  extractedText: firestoreMetadata.extractedText || "",
                  scenes: firestoreMetadata.scenes || [],
                  topics: firestoreMetadata.topics || [],
                }
              : undefined,
          }
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error)
          return null
        }
      }),
    )

    // Filter out null values (failed processing)
    processedFiles = processedFiles.filter(Boolean)

    // Apply file type filter
    if (fileType && fileType !== "all") {
      processedFiles = processedFiles.filter((file) => file.fileType === fileType)
    }

    // Apply search filter if provided
    if (searchText) {
      const searchLower = searchText.toLowerCase()

      // Filter files based on name or metadata
      processedFiles = processedFiles.filter((file) => {
        // Check filename (original name)
        if (file.name.toLowerCase().includes(searchLower)) {
          return true
        }

        // Check metadata only if it exists
        if (file.hasMetadata && file.aiAnalysis) {
          // Check tags
          if (file.aiAnalysis.tags && Array.isArray(file.aiAnalysis.tags)) {
            if (file.aiAnalysis.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))) {
              return true
            }
          }

          // Check topics
          if (file.aiAnalysis.topics && Array.isArray(file.aiAnalysis.topics)) {
            if (file.aiAnalysis.topics.some((topic: string) => topic.toLowerCase().includes(searchLower))) {
              return true
            }
          }

          // Check transcription
          if (file.aiAnalysis.transcript && file.aiAnalysis.transcript.toLowerCase().includes(searchLower)) {
            return true
          }

          // Check extracted text
          if (file.aiAnalysis.extractedText && file.aiAnalysis.extractedText.toLowerCase().includes(searchLower)) {
            return true
          }
        }

        return false
      })
    }

    // Apply pagination
    const paginatedFiles = processedFiles.slice(offset, offset + limit)

    console.log(`Returning ${paginatedFiles.length} files (${processedFiles.length} total after filtering)`)

    return NextResponse.json({
      success: true,
      files: paginatedFiles,
      total: processedFiles.length,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching files:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch files",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
