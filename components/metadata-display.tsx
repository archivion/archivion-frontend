"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Clock, XCircle, AlertCircle, Loader2, Tag, FileText, MessageSquare } from "lucide-react"

interface MetadataDisplayProps {
  metadata: any
  fileType: string
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("id-ID", {
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

  const renderGeneralMetadata = () => (
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
              <strong>Processed at:</strong> {formatDate(metadata.processedAt)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const renderImageMetadata = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Image Analysis</h3>

      {metadata.tags && metadata.tags.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium">Tag ({metadata.tags.length})</h4>
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
    </div>
  )

  const renderVideoMetadata = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Video Analysis</h3>

      {metadata.tags && metadata.tags.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium">Tag Video ({metadata.tags.length})</h4>
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
  )

  const renderAudioMetadata = () => (
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
  )

  return (
    <div className="space-y-6">
      {/* General Metadata */}
      {renderGeneralMetadata()}

      {/* Type-specific Metadata */}
      {fileType === "image" && renderImageMetadata()}
      {fileType === "video" && renderVideoMetadata()}
      {fileType === "audio" && renderAudioMetadata()}
    </div>
  )
}
