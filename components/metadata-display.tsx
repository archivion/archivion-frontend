"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Tag, FileText, MessageSquare } from "lucide-react"

interface MetadataDisplayProps {
  metadata: any
  fileType: string
}

// Helper function to check if metadata is incomplete
const checkIfMetadataIncomplete = (metadata: any, fileType: string): boolean => {
  switch (fileType) {
    case "image":
      return !(
        metadata.tags &&
        Array.isArray(metadata.tags) &&
        metadata.tags.length > 0 &&
        metadata.object_tags &&
        Array.isArray(metadata.object_tags) &&
        metadata.object_tags.length > 0
      )

    case "video":
      return !(
        metadata.tags &&
        Array.isArray(metadata.tags) &&
        metadata.tags.length > 0 &&
        metadata.object_tags &&
        Array.isArray(metadata.object_tags) &&
        metadata.object_tags.length > 0 &&
        metadata.transcription &&
        metadata.transcription.length > 0 &&
        metadata.topics &&
        Array.isArray(metadata.topics) &&
        metadata.topics.length > 0
      )

    case "audio":
      return !(
        metadata.transcription &&
        metadata.transcription.length > 0 &&
        metadata.topics &&
        Array.isArray(metadata.topics) &&
        metadata.topics.length > 0
      )

    default:
      return false
  }
}

// Function to render partial metadata with missing indicators
const renderPartialMetadata = (metadata: any, fileType: string) => {
  return (
    <div className="space-y-4">
      {/* General metadata always available */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">File Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {metadata.uploadTime && (
              <div>
                <strong>Upload Time:</strong> {new Date(metadata.uploadTime).toLocaleString("en-US")}
              </div>
            )}
            {metadata.processedAt && (
              <div>
                <strong>Processed At:</strong> {new Date(metadata.processedAt).toLocaleString("en-US")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Type-specific partial rendering */}
      {fileType === "image" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Image Analysis</h3>

          {/* Tags */}
          {metadata.tags && metadata.tags.length > 0 ? (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium">Tags ({metadata.tags.length})</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {metadata.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <h4 className="font-medium text-gray-600">Tags - Processing...</h4>
              </div>
            </div>
          )}

          {/* Object tags */}
          {metadata.object_tags && metadata.object_tags.length > 0 ? (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-green-600" />
                <h4 className="font-medium">Detected Objects ({metadata.object_tags.length})</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {metadata.object_tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <h4 className="font-medium text-gray-600">Object Detection - Processing...</h4>
              </div>
            </div>
          )}

          {/* Extracted Text (optional for images) */}
          {metadata.extractedText && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <h4 className="font-medium">Extracted Text</h4>
              </div>
              <div className="bg-gray-50 p-4 rounded-md max-h-60 overflow-y-auto">
                <p className="whitespace-pre-line text-sm">{metadata.extractedText}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {fileType === "video" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Video Analysis</h3>

          {/* Tags */}
          {metadata.tags && metadata.tags.length > 0 ? (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium">Video Tags ({metadata.tags.length})</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {metadata.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <h4 className="font-medium text-gray-600">Video Tags - Processing...</h4>
              </div>
            </div>
          )}

          {/* Object tags */}
          {metadata.object_tags && metadata.object_tags.length > 0 ? (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-green-600" />
                <h4 className="font-medium">Detected Objects ({metadata.object_tags.length})</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {metadata.object_tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <h4 className="font-medium text-gray-600">Object Detection - Processing...</h4>
              </div>
            </div>
          )}

          {/* Topics */}
          {metadata.topics && metadata.topics.length > 0 ? (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-purple-600" />
                <h4 className="font-medium">Topics Discussed ({metadata.topics.length})</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {metadata.topics.map((topic: string, index: number) => (
                  <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <h4 className="font-medium text-gray-600">Topic Analysis - Processing...</h4>
              </div>
              <p className="text-sm text-gray-500">Identifying topics discussed in the video...</p>
            </div>
          )}

          {/* Transcription */}
          {metadata.transcription && metadata.transcription.length > 0 ? (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <h4 className="font-medium">Transcription</h4>
              </div>
              <div className="bg-gray-50 p-4 rounded-md max-h-60 overflow-y-auto">
                <p className="whitespace-pre-line text-sm">{metadata.transcription}</p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <h4 className="font-medium text-gray-600">Transcription - Processing...</h4>
              </div>
              <p className="text-sm text-gray-500">Converting audio to text...</p>
            </div>
          )}
        </div>
      )}

      {fileType === "audio" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Audio Analysis</h3>

          {/* Topics */}
          {metadata.topics && metadata.topics.length > 0 ? (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-purple-600" />
                <h4 className="font-medium">Topics Discussed ({metadata.topics.length})</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {metadata.topics.map((topic: string, index: number) => (
                  <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <h4 className="font-medium text-gray-600">Topic Analysis - Processing...</h4>
              </div>
              <p className="text-sm text-gray-500">Identifying topics discussed in the audio...</p>
            </div>
          )}

          {/* Transcription */}
          {metadata.transcription && metadata.transcription.length > 0 ? (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <h4 className="font-medium">Transcription</h4>
              </div>
              <div className="bg-gray-50 p-4 rounded-md max-h-60 overflow-y-auto">
                <p className="whitespace-pre-line text-sm">{metadata.transcription}</p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <h4 className="font-medium text-gray-600">Transcription - Processing...</h4>
              </div>
              <p className="text-sm text-gray-500">Converting audio to text...</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function MetadataDisplay({ metadata, fileType }: MetadataDisplayProps) {
  if (!metadata) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No metadata available for this file.</AlertDescription>
      </Alert>
    )
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    } catch {
      return dateString || "N/A"
    }
  }

  // Check if metadata is incomplete
  const isIncomplete = checkIfMetadataIncomplete(metadata, fileType)

  if (isIncomplete) {
    return (
      <div className="space-y-4">
        <Alert className="bg-yellow-50 text-yellow-800 border-yellow-200">
          <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
          <AlertDescription>
            <strong>Analysis in progress...</strong>
            <br />
            Some analysis results are still being processed. The information below may be incomplete.
          </AlertDescription>
        </Alert>

        {/* Show partial metadata */}
        {renderPartialMetadata(metadata, fileType)}
      </div>
    )
  }

  // Show complete metadata
  const renderCompleteMetadata = () => (
    <div className="space-y-6">
      {/* General Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">File Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {metadata.uploadTime && (
              <div>
                <strong>Upload Time:</strong> {formatDate(metadata.uploadTime)}
              </div>
            )}
            {metadata.processedAt && (
              <div>
                <strong>Processed At:</strong> {formatDate(metadata.processedAt)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Type-specific complete metadata */}
      {fileType === "image" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Image Analysis</h3>

          {metadata.tags && metadata.tags.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium">Tags ({metadata.tags.length})</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {metadata.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {metadata.object_tags && metadata.object_tags.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-green-600" />
                <h4 className="font-medium">Detected Objects ({metadata.object_tags.length})</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {metadata.object_tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {metadata.extractedText && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <h4 className="font-medium">Extracted Text</h4>
              </div>
              <div className="bg-gray-50 p-4 rounded-md max-h-60 overflow-y-auto">
                <p className="whitespace-pre-line text-sm">{metadata.extractedText}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {fileType === "video" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Video Analysis</h3>

          {metadata.tags && metadata.tags.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium">Video Tags ({metadata.tags.length})</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {metadata.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {metadata.object_tags && metadata.object_tags.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-green-600" />
                <h4 className="font-medium">Detected Objects ({metadata.object_tags.length})</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {metadata.object_tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {metadata.topics && metadata.topics.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-purple-600" />
                <h4 className="font-medium">Topics Discussed ({metadata.topics.length})</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {metadata.topics.map((topic: string, index: number) => (
                  <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {metadata.transcription && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <h4 className="font-medium">Transcription</h4>
              </div>
              <div className="bg-gray-50 p-4 rounded-md max-h-60 overflow-y-auto">
                <p className="whitespace-pre-line text-sm">{metadata.transcription}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {fileType === "audio" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Audio Analysis</h3>

          {metadata.topics && metadata.topics.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-purple-600" />
                <h4 className="font-medium">Topics Discussed ({metadata.topics.length})</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {metadata.topics.map((topic: string, index: number) => (
                  <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {metadata.transcription && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <h4 className="font-medium">Transcription</h4>
              </div>
              <div className="bg-gray-50 p-4 rounded-md max-h-60 overflow-y-auto">
                <p className="whitespace-pre-line text-sm">{metadata.transcription}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return renderCompleteMetadata()
}
