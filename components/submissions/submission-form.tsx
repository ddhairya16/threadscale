'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSubmissionDraft } from '@/lib/hooks/use-submission-draft'
import { extractRedditMetadata, type RedditMetadata } from '@/lib/utils/reddit'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, UploadCloud, X, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import imageCompression from 'browser-image-compression'

export function SubmissionForm({ taskId }: { taskId: string }) {
  const router = useRouter()
  const { draft, updateDraft, clearDraft, hydrated } = useSubmissionDraft(taskId)
  const [metadata, setMetadata] = useState<RedditMetadata | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)

  // Parse URL whenever draft.redditUrl changes
  useEffect(() => {
    if (draft.redditUrl.includes('reddit.com')) {
      setMetadata(extractRedditMetadata(draft.redditUrl))
    } else {
      setMetadata(null)
    }
  }, [draft.redditUrl])

  // Cleanup object URLs
  useEffect(() => {
    return () => previewUrls.forEach(URL.revokeObjectURL)
  }, [previewUrls])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const rawFiles = Array.from(e.target.files)
    
    setIsCompressing(true)
    const toastId = toast.loading('Compressing images...')
    try {
      const compressedFiles = await Promise.all(
        rawFiles.map(async (file) => {
          if (!file.type.startsWith('image/')) return file
          return await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1600,
            useWebWorker: true,
          })
        })
      )
      
      setFiles(prev => [...prev, ...compressedFiles])
      setPreviewUrls(prev => [...prev, ...compressedFiles.map(f => URL.createObjectURL(f))])
      toast.success('Images ready!', { id: toastId })
    } catch (err) {
      toast.error('Failed to compress images.', { id: toastId })
    } finally {
      setIsCompressing(false)
      e.target.value = ''
    }
  }

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index])
    setFiles(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.redditUrl || files.length === 0) {
      toast.error('Please provide a Reddit URL and at least one screenshot.')
      return
    }
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('taskId', taskId)
      formData.append('redditUrl', draft.redditUrl)
      files.forEach(f => formData.append('screenshots', f))


      const res = await fetch('/api/v1/submissions', { method: 'POST', body: formData })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to submit')
      }

      clearDraft()
      toast.success('Proof submitted successfully!')
      router.push(`/tasks/${taskId}/success`)
    } catch (err: any) {
      toast.error(`Submission failed: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Step 1: Reddit URL */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">1</div>
            <h2 className="text-lg font-semibold">Reddit URL</h2>
          </div>
          <div className="space-y-2 pl-8">
            <Label htmlFor="url">Link to your comment or post</Label>
            <Input
              id="url"
              placeholder="https://reddit.com/r/..."
              value={draft.redditUrl}
              onChange={e => updateDraft({ redditUrl: e.target.value })}
              className="max-w-xl bg-background"
            />
            {metadata && metadata.type !== 'unknown' && (
              <div className="flex items-center gap-2 text-sm text-emerald-500 bg-emerald-500/10 px-3 py-2 rounded-md w-fit">
                <CheckCircle2 className="h-4 w-4" />
                Detected: {metadata.type} in r/{metadata.subreddit}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Screenshots */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">2</div>
            <h2 className="text-lg font-semibold">Screenshots</h2>
          </div>
          <div className="space-y-4 pl-8">
            <div
              className="border-2 border-dashed border-border/50 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-accent/30 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="font-medium">Click or drag images to upload</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, or WebP. Multiple allowed.</p>
              <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {previewUrls.map((src, i) => (
                  <div key={i} className="relative group rounded-md overflow-hidden border border-border bg-black aspect-[4/3]">
                    <Image src={src} alt={`Screenshot ${i + 1}`} fill className="object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>



      <div className="flex justify-end gap-4">
        <Button variant="ghost" type="button" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting || !draft.redditUrl || files.length === 0}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Proof
        </Button>
      </div>
    </form>
  )
}
