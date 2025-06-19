"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import {
  Upload,
  Search,
  Download,
  Eye,
  Trash2,
  AlertCircle,
  RefreshCw,
  Loader2,
  CheckCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useDropzone } from "react-dropzone"
import { MetadataDisplay } from "@/components/metadata-display"

interface MediaFile {
  id: string
  name: string
  fileName: string
  fileType: "image" | "video" | "audio" | "unknown"
  size: number
  contentType: string
  createdAt: string
  status: "uploaded" | "processing" | "completed" | "error"
  hasMetadata?: boolean
  aiAnalysis?: {
    tags: string[]
    transcript?: string
    extractedText?: string
    scenes?: string[]
    topics?: string[]
  }
  downloadUrl?: string
  previewUrl?: string
  publicUrl?: string
}

type SortField = "name" | "createdAt"
type SortOrder = "asc" | "desc"

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

const ALLOWED_EXTENSIONS = {
  audio: [".mp3", ".wav", ".flac"],
  video: [".mp4", ".avi", ".mov", ".mkv"],
  image: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
}

export default function MediaLibrary() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [filteredFiles, setFilteredFiles] = useState<MediaFile[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFileType, setSelectedFileType] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [uploadSuccess, setUploadSuccess] = useState("")
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null)
  const [fileMetadata, setFileMetadata] = useState<any>(null)
  const [metadataLoading, setMetadataLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("library")
  const [detailLoading, setDetailLoading] = useState<string | null>(null)

  // Sort files function
  const sortFiles = useCallback(
    (filesToSort: MediaFile[]) => {
      return [...filesToSort].sort((a, b) => {
        let comparison = 0

        if (sortField === "name") {
          comparison = a.name.localeCompare(b.name)
        } else if (sortField === "createdAt") {
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        }

        return sortOrder === "asc" ? comparison : -comparison
      })
    },
    [sortField, sortOrder],
  )

  // Apply sorting whenever sort options change
  useEffect(() => {
    setFilteredFiles(sortFiles(filteredFiles))
  }, [sortField, sortOrder, sortFiles])

  // Fetch files from API
  const fetchFiles = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedFileType !== "all") {
        params.append("fileType", selectedFileType)
      }
      if (searchQuery) {
        params.append("searchText", searchQuery)
      }

      console.log("Fetching files with params:", params.toString())

      const response = await fetch(`/api/files?${params}`)
      const data = await response.json()

      if (data.success) {
        const sortedFiles = sortFiles(data.files || [])
        setFiles(data.files || [])
        setFilteredFiles(sortedFiles)
        console.log(`Loaded ${data.files?.length || 0} files`)

        // Log files with metadata status
        data.files?.forEach((file: MediaFile) => {
          console.log(
            `File: ${file.name} (${file.fileName}) - Status: ${file.status} - HasMetadata: ${file.hasMetadata}`,
          )
        })
      } else {
        console.error("Failed to fetch files:", data.error)
        setUploadError(data.error || "Failed to fetch files")
      }
    } catch (error) {
      console.error("Error fetching files:", error)
      setUploadError("Failed to connect to server")
    } finally {
      setLoading(false)
    }
  }, [selectedFileType, searchQuery, sortFiles])

  // Load files on component mount and when filters change
  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  // Validate file extension
  const validateFileExtension = (file: File): { valid: boolean; fileType: string } => {
    const fileName = file.name.toLowerCase()
    const fileExt = fileName.substring(fileName.lastIndexOf("."))

    if (ALLOWED_EXTENSIONS.audio.includes(fileExt)) {
      return { valid: true, fileType: "audio" }
    } else if (ALLOWED_EXTENSIONS.video.includes(fileExt)) {
      return { valid: true, fileType: "video" }
    } else if (ALLOWED_EXTENSIONS.image.includes(fileExt)) {
      return { valid: true, fileType: "image" }
    }

    return { valid: false, fileType: "unknown" }
  }

  // Handle file upload with real API
  const handleFileUpload = async (file: File) => {
    setUploadError("")
    setUploadSuccess("")
    setUploadProgress(0)

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(
        `File size exceeds the maximum limit of 100MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
      )
      return
    }

    // Validate file extension
    const { valid, fileType } = validateFileExtension(file)
    if (!valid) {
      setUploadError(
        `File type not allowed. Allowed extensions: 
        Image: ${ALLOWED_EXTENSIONS.image.join(", ")}
        Video: ${ALLOWED_EXTENSIONS.video.join(", ")}
        Audio: ${ALLOWED_EXTENSIONS.audio.join(", ")}`,
      )
      return
    }

    setIsUploading(true)

    try {
      console.log("Uploading file:", file.name, "Size:", file.size)

      const formData = new FormData()
      formData.append("file", file)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result = await response.json()

      if (result.success) {
        console.log("Upload successful:", result.file)

        // Add new file to the list
        const newFile: MediaFile = {
          ...result.file,
          status: "uploaded", // Start with uploaded status
          hasMetadata: false, // No metadata initially
        }

        const updatedFiles = [newFile, ...files]
        const sortedFiles = sortFiles(updatedFiles)

        setFiles(updatedFiles)
        setFilteredFiles(sortedFiles)

        // Show success message
        setUploadSuccess(`File "${file.name}" uploaded successfully! Your file will be processed soon.`)

        // Reset upload state after a delay
        setTimeout(() => {
          setUploadProgress(0)
          setIsUploading(false)
        }, 1000)

        // Refresh files after a short delay to check for processing status
        setTimeout(() => {
          fetchFiles()
        }, 5000)
      } else {
        throw new Error(result.error || "Upload failed")
      }
    } catch (error) {
      console.error("Upload failed:", error)
      setUploadError(error instanceof Error ? error.message : "Upload failed")
      setUploadProgress(0)
      setIsUploading(false)
    }
  }

  // Handle multiple file upload
  const handleMultipleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (!fileList) return

    for (let i = 0; i < fileList.length; i++) {
      await handleFileUpload(fileList[i])
    }
  }

  // Drag and drop setup
  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      handleFileUpload(file)
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": ALLOWED_EXTENSIONS.audio,
      "video/*": ALLOWED_EXTENSIONS.video,
      "image/*": ALLOWED_EXTENSIONS.image,
    },
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  })

  // Handle file deletion
  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return

    try {
      console.log("Deleting file:", fileId)

      const response = await fetch(`/api/files/${encodeURIComponent(fileId)}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        // Remove file from state
        const updatedFiles = files.filter((file) => file.id !== fileId)
        const sortedFiles = sortFiles(
          updatedFiles.filter((file) => selectedFileType === "all" || file.fileType === selectedFileType),
        )

        setFiles(updatedFiles)
        setFilteredFiles(sortedFiles)

        // Close modal if deleted file was selected
        if (selectedFile?.id === fileId) {
          setShowDetails(false)
          setSelectedFile(null)
        }

        console.log("File deleted successfully")
      } else {
        throw new Error(result.error || "Delete failed")
      }
    } catch (error) {
      console.error("Delete failed:", error)
      setUploadError(error instanceof Error ? error.message : "Delete failed")
    }
  }

  // Handle file download
  const handleDownloadFile = async (fileId: string, fileName: string) => {
    setDownloadingFileId(fileId) // Set loading state for this specific file
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(fileId)}/download`)
      if (!response.ok) throw new Error("Download failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      a.style.display = "none"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Download error:", error)
      setUploadError("Failed to download the file.")
    } finally {
      setDownloadingFileId(null) // Reset loading state
    }
  }    

  const viewFileDetails = async (file: MediaFile) => {
    setDetailLoading(file.id)

    try {
      // Fetch latest file data with signed URLs
      const response = await fetch(`/api/files/${encodeURIComponent(file.id)}`)
      const result = await response.json()

      if (result.success) {
        // Preserve status from original file if not in result
        const fileWithStatus = {
          ...result.file,
          status: result.file.status || file.status,
          hasMetadata: file.hasMetadata,
        }
        setSelectedFile(fileWithStatus)
      } else {
        setSelectedFile(file)
      }

      // Fetch metadata using fileName (bucket name with timestamp)
      if (file.hasMetadata) {
        setMetadataLoading(true)
        setFileMetadata(null)

        try {
          const metadataResponse = await fetch(`/api/metadata/${encodeURIComponent(file.fileName)}`)
          const metadataResult = await metadataResponse.json()

          if (metadataResult.success) {
            setFileMetadata(metadataResult.metadata)
            console.log("Metadata loaded:", metadataResult.metadata)
          } else {
            console.log("No metadata found:", metadataResult.error)
            setFileMetadata(null)
          }
        } catch (metadataError) {
          console.error("Error fetching metadata:", metadataError)
          setFileMetadata(null)
        } finally {
          setMetadataLoading(false)
        }
      } else {
        // No metadata available yet
        setFileMetadata(null)
        setMetadataLoading(false)
      }

      setShowDetails(true)
    } catch (error) {
      console.error("Error fetching file details:", error)
      setSelectedFile(file)
      setShowDetails(true)
    } finally {
      setDetailLoading(null)
    }
  }

  // Handle sort change
  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      // Toggle order if same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      // Change field and set default order
      setSortField(field)
      setSortOrder(field === "createdAt" ? "desc" : "asc")
    }
  }

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  // Utility functions
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "image":
        return "🖼️"
      case "video":
        return "🎥"
      case "audio":
        return "🎵"
      default:
        return "📄"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "processing":
        return "bg-yellow-100 text-yellow-800"
      case "uploaded":
        return "bg-blue-100 text-blue-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed"
      case "processing":
        return "Processed"
      case "uploaded":
        return "Processed"
      case "error":
        return "Error"
      default:
        return status
    }
  }

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Create simple SVG thumbnail for video and audio
  const createThumbnail = (fileType: string) => {
    if (fileType === "video") {
      return (
        <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
          <div className="text-6xl">🎥</div>
        </div>
      )
    } else if (fileType === "audio") {
      return (
        <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
          <div className="text-6xl">🎵</div>
        </div>
      )
    }
    return null
  }

  // Get thumbnail based on file type
  const getThumbnail = (file: MediaFile) => {
    if (file.fileType === "image") {
      return (
        <img
          src={file.downloadUrl || "/placeholder.jpg"}
          alt={file.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.jpg"
          }}
        />
      )
    } else {
      return createThumbnail(file.fileType)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Archivion</h1>
            <p className="text-gray-600">
            Upload and share media seamlessly, and find what you need in seconds with intelligent auto-tagging.
            </p>
          </div>
          <Button onClick={fetchFiles} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="library">Media File List ({files.length})</TabsTrigger>
          <TabsTrigger value="upload">Upload File</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Media File
              </CardTitle>
            </CardHeader>
            <CardContent>
              {uploadError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}

              {uploadSuccess && (
                <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>{uploadSuccess}</AlertDescription>
                </Alert>
              )}

              {/* Drag & Drop Area */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}
                  ${isUploading ? "pointer-events-none opacity-50" : ""}
                `}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div>
                  {isDragActive ? (
                    <p className="text-lg font-medium text-blue-600">Drop your files here...</p>
                  ) : (
                    <>
                      <p className="text-lg font-medium">
                        {isUploading ? "Uploading..." : "Drag & drop files here, or click to select"}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">Supported file types:</p>
                      <div className="grid grid-cols-3 gap-2 mt-2 max-w-md mx-auto text-xs text-gray-600">
                        <div>
                          <p className="font-medium">Image</p>
                          <p>{ALLOWED_EXTENSIONS.image.join(", ")}</p>
                        </div>
                        <div>
                          <p className="font-medium">Video</p>
                          <p>{ALLOWED_EXTENSIONS.video.join(", ")}</p>
                        </div>
                        <div>
                          <p className="font-medium">Audio</p>
                          <p>{ALLOWED_EXTENSIONS.audio.join(", ")}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Maximum file size: 100MB</p>
                    </>
                  )}
                </div>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Uploading...</span>
                    <span className="text-sm text-gray-500">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              {/* Alternative File Input */}
              <div className="mt-4 text-center">
                <input
                  type="file"
                  accept={[...ALLOWED_EXTENSIONS.image, ...ALLOWED_EXTENSIONS.video, ...ALLOWED_EXTENSIONS.audio].join(
                    ",",
                  )}
                  onChange={handleMultipleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="file-upload-input"
                  multiple
                />
                <label htmlFor="file-upload-input">
                  <Button variant="outline" disabled={isUploading} asChild>
                    <span className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Select File
                    </span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by name, tag, topic, or transcript..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && fetchFiles()}
                  />
                </div>
                <Select value={selectedFileType} onValueChange={setSelectedFileType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={fetchFiles} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {/* Sorting Controls */}
              <div className="flex gap-2">
                <span className="text-sm font-medium text-gray-700 flex items-center">Sort by:</span>
                <Button
                  variant={sortField === "createdAt" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSortChange("createdAt")}
                  className="flex items-center gap-1"
                >
                  Upload Time
                  {getSortIcon("createdAt")}
                </Button>
                <Button
                  variant={sortField === "name" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSortChange("name")}
                  className="flex items-center gap-1"
                >
                  Name
                  {getSortIcon("name")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Files Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p>Loading media files...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No files found. Upload some media to get started!</p>
              </div>
            ) : (
              filteredFiles.map((file) => (
                <Card key={file.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-2xl">{getFileIcon(file.fileType)}</span>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-sm truncate" title={file.name}>
                            {file.name}
                          </CardTitle>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)} MB</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(file.status)}>{getStatusText(file.status)}</Badge>
                    </div>
                  </CardHeader>

                  {/* File Preview */}
                  <div className="px-4 pb-2">
                    <div className="w-full h-32 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                      {getThumbnail(file)}
                    </div>
                  </div>

                  <CardContent className="space-y-3">
                    <div className="text-xs text-gray-500">Uploaded: {formatDate(file.createdAt)}</div>
                  </CardContent>

                  <CardFooter className="flex gap-2 pt-2">
                  <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadFile(file.id, file.name)}
                      disabled={downloadingFileId === file.id} // Disable while downloading
                    >
                      {downloadingFileId === file.id ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewFileDetails(file)}
                      disabled={detailLoading === file.id}
                    >
                      {detailLoading === file.id ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Eye className="h-3 w-3 mr-1" />
                      )}
                      {detailLoading === file.id ? "Loading..." : "Detail"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-auto text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* File Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedFile && (
                <>
                  <span>{getFileIcon(selectedFile.fileType)}</span>
                  {selectedFile.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedFile && (
                <>
                  {selectedFile.fileType} • {formatFileSize(selectedFile.size)} MB • Uploaded{" "}
                  {formatDate(selectedFile.createdAt)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedFile && (
            <div className="space-y-6">
              {/* File Preview */}
              <div className="rounded-md overflow-hidden bg-gray-100 flex justify-center">
                {selectedFile.fileType === "image" && (
                  <img
                    src={selectedFile.downloadUrl || "/placeholder.jpg"}
                    alt={selectedFile.name}
                    className="max-w-full h-auto max-h-96 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.jpg"
                    }}
                  />
                )}
                {selectedFile.fileType === "video" && (
                  <div className="w-full max-w-2xl">
                    {selectedFile.downloadUrl ? (
                      <video
                        src={selectedFile.downloadUrl}
                        controls
                        className="w-full aspect-video rounded"
                        preload="metadata"
                      >
                        Your browser does not support the video player.
                      </video>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-red-100 to-red-200 rounded flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-8xl mb-4">🎥</div>
                          <p className="text-sm text-gray-600">Loading video...</p>
                          <p className="text-xs text-gray-500">{selectedFile.name}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {selectedFile.fileType === "audio" && (
                  <div className="w-full p-8 text-center">
                    <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg p-8 mb-4">
                      <div className="text-8xl mb-4">🎵</div>
                      <p className="text-sm text-gray-600">Audio File</p>
                      <p className="text-xs text-gray-500">{selectedFile.name}</p>
                    </div>
                    {selectedFile.downloadUrl && (
                      <audio src={selectedFile.downloadUrl} controls className="w-full max-w-md" />
                    )}
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>File Name:</strong> {selectedFile.name}
                </div>
                <div>
                  <strong>File Type:</strong> {selectedFile.contentType}
                </div>
                <div>
                  <strong>Size:</strong> {formatFileSize(selectedFile.size)} MB
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  <Badge className={getStatusColor(selectedFile.status)}>{getStatusText(selectedFile.status)}</Badge>
                </div>
              </div>

              {/* Enhanced Metadata */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  📊 Metadata
                  {metadataLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                </h3>

                {selectedFile.hasMetadata === false ? (
                  <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <AlertDescription>
                      <strong>Processing file...</strong>
                      <br />
                      AI analysis is in progress. Metadata will be available once processing is complete. Please refresh the page in a few minutes to view the results.
                    </AlertDescription>
                  </Alert>
                ) : metadataLoading ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Loading metadata...</p>
                  </div>
                ) : (
                  <MetadataDisplay metadata={fileMetadata} fileType={selectedFile?.fileType || "unknown"} />
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                  variant="outline"
                  disabled={downloadingFileId === selectedFile.id} // Disable while downloading
                  onClick={() => handleDownloadFile(selectedFile.id, selectedFile.name)}
                >
                  {downloadingFileId === selectedFile.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDeleteFile(selectedFile.id)
                    setShowDetails(false)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
