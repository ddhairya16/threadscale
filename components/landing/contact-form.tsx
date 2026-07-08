'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function ContactForm() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    website: '',
    project_description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const supabase = createClient()
      const { error } = await supabase.from('business_inquiries').insert([formData])
      
      if (error) throw error
      
      toast.success("Inquiry sent successfully! We'll be in touch soon.")
      setFormData({ company_name: '', contact_name: '', email: '', website: '', project_description: '' })
    } catch (err) {
      console.error(err)
      toast.error("Failed to send inquiry. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl">
      <h3 className="text-2xl font-semibold mb-6">Discuss your community growth</h3>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="contact_name">Full Name *</Label>
            <Input 
              id="contact_name" 
              required 
              className="bg-background/50 border-border/60"
              value={formData.contact_name}
              onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work Email *</Label>
            <Input 
              id="email" 
              type="email" 
              required 
              className="bg-background/50 border-border/60"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name *</Label>
            <Input 
              id="company_name" 
              required 
              className="bg-background/50 border-border/60"
              value={formData.company_name}
              onChange={(e) => setFormData({...formData, company_name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website URL</Label>
            <Input 
              id="website" 
              type="url" 
              placeholder="https://"
              className="bg-background/50 border-border/60"
              value={formData.website}
              onChange={(e) => setFormData({...formData, website: e.target.value})}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="project_description">What are your community goals? *</Label>
          <Textarea 
            id="project_description" 
            required 
            rows={4}
            className="bg-background/50 border-border/60 resize-none"
            placeholder="Tell us about your project, target audience, and growth objectives..."
            value={formData.project_description}
            onChange={(e) => setFormData({...formData, project_description: e.target.value})}
          />
        </div>
        
        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full h-12 text-base font-medium"
        >
          {loading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Send className="mr-2 h-5 w-5" />
          )}
          Send Inquiry
        </Button>
      </form>
    </div>
  )
}
