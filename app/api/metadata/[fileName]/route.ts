import { type NextRequest, NextResponse } from "next/server"
import { Firestore } from "@google-cloud/firestore"

// Initialize Firestore with custom database ID
const firestore = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
  databaseId: process.env.FIRESTORE_DATABASE_ID || "dbtubesltka2425", // Use environment variable or default
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ fileName: string }> }) {
  try {
    const { fileName } = await params
    const decodedFileName = decodeURIComponent(fileName) // Decode URL encoding

    console.log(
      `Fetching metadata for fileName: ${decodedFileName} from database: ${process.env.FIRESTORE_DATABASE_ID || "dbtubesltka2425"}`,
    )

    // Query media_metadata collection by fileName
    const metadataQuery = await firestore
      .collection("media_metadata")
      .where("fileName", "==", decodedFileName)
      .limit(1)
      .get()

    if (metadataQuery.empty) {
      console.log(`No metadata found for fileName: ${decodedFileName}`)

      // Try alternative query patterns
      console.log("Trying alternative queries...")

      // Try with original name pattern
      const altQuery1 = await firestore
        .collection("media_metadata")
        .where("originalName", "==", decodedFileName)
        .limit(1)
        .get()

      if (!altQuery1.empty) {
        const metadataDoc = altQuery1.docs[0]
        const metadata = metadataDoc.data()
        const processedMetadata = processFirestoreData(metadata)

        console.log(`Found metadata with originalName: ${decodedFileName}`)
        return NextResponse.json({
          success: true,
          metadata: {
            id: metadataDoc.id,
            ...processedMetadata,
          },
        })
      }

      // Try partial match
      const allDocs = await firestore.collection("media_metadata").get()
      console.log(`Total documents in media_metadata: ${allDocs.size}`)

      // Log first few documents for debugging
      allDocs.docs.slice(0, 3).forEach((doc, index) => {
        const data = doc.data()
        console.log(`Document ${index + 1}:`, {
          id: doc.id,
          fileName: data.fileName,
          originalName: data.originalName,
        })
      })

      return NextResponse.json({
        success: false,
        error: "Metadata not found",
        metadata: null,
        debug: {
          searchedFileName: decodedFileName,
          totalDocuments: allDocs.size,
          databaseId: process.env.FIRESTORE_DATABASE_ID || "dbtubesltka2425",
        },
      })
    }

    const metadataDoc = metadataQuery.docs[0]
    const metadata = metadataDoc.data()

    // Convert Firestore timestamps to ISO strings
    const processedMetadata = processFirestoreData(metadata)

    console.log(`Found metadata for fileName: ${decodedFileName}`)

    return NextResponse.json({
      success: true,
      metadata: {
        id: metadataDoc.id,
        ...processedMetadata,
      },
    })
  } catch (error) {
    console.error("Error fetching metadata:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch metadata",
        details: error instanceof Error ? error.message : "Unknown error",
        metadata: null,
      },
      { status: 500 },
    )
  }
}

// Helper function to process Firestore data
function processFirestoreData(data: any): any {
  const processed: any = {}

  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === "object" && "toDate" in value) {
      // Convert Firestore Timestamp to ISO string
      processed[key] = value.toDate().toISOString()
    } else if (Array.isArray(value)) {
      // Process arrays recursively
      processed[key] = value.map((item) => (typeof item === "object" ? processFirestoreData(item) : item))
    } else if (value && typeof value === "object") {
      // Process nested objects recursively
      processed[key] = processFirestoreData(value)
    } else {
      processed[key] = value
    }
  }

  return processed
}
