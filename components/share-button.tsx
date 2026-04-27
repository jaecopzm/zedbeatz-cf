"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Link as LinkIcon, Share2 } from "lucide-react";
import { showToast } from "@/components/toast";

function ShareContent({ copied, copyLink, shareUrl, shareToTwitter, shareToFacebook, shareToWhatsApp }: {
  copied: boolean; copyLink: () => void; shareUrl: string;
  shareToTwitter: () => void; shareToFacebook: () => void; shareToWhatsApp: () => void;
}) {
  return (
    <div className="space-y-3">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={copyLink}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all border ${
          copied 
            ? "bg-[var(--primary)]/20 border-[var(--primary)] shadow-[0_0_20px_rgba(30,215,96,0.3)]" 
            : "bg-white/[0.05] border-white/10 hover:bg-white/[0.08] hover:border-white/20"
        }`}
      >
        <motion.div 
          animate={{ rotate: copied ? 360 : 0 }}
          transition={{ duration: 0.5 }}
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            copied ? "bg-[var(--primary)] shadow-lg" : "bg-white/10"
          }`}
        >
          {copied ? <Check size={16} className="text-black font-bold" /> : <LinkIcon size={16} />}
        </motion.div>
        <div className="flex-1 text-left min-w-0 overflow-hidden">
          <p className="font-bold text-sm">{copied ? "Copied!" : "Copy Link"}</p>
          <p className="text-xs text-[var(--muted)] truncate">{shareUrl}</p>
        </div>
      </motion.button>

      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={shareToWhatsApp} 
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 rounded-xl transition-all"
      >
        <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shrink-0 shadow-lg">
          <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
        </div>
        <span className="font-bold text-sm">WhatsApp</span>
      </motion.button>

      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={shareToTwitter} 
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 rounded-xl transition-all"
      >
        <div className="w-10 h-10 rounded-full bg-black border border-white/20 flex items-center justify-center shrink-0 shadow-lg">
          <svg className="w-4 h-4" fill="white" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </div>
        <span className="font-bold text-sm">X (Twitter)</span>
      </motion.button>

      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={shareToFacebook} 
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 rounded-xl transition-all"
      >
        <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center shrink-0 shadow-lg">
          <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </div>
        <span className="font-bold text-sm">Facebook</span>
      </motion.button>
    </div>
  );
}

export default function ShareButton({ title, url }: { title: string; url?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  function copyLink() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showToast("Link copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  }

  function shareToTwitter() {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  }

  function shareToFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  }

  function shareToWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl}`)}`, '_blank');
  }

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
      >
        <Share2 size={17} />
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setOpen(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: "100%", scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: "100%", scale: 0.95 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full md:max-w-md md:mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-br from-[var(--surface)]/95 to-[var(--surface-2)]/95 backdrop-blur-2xl md:rounded-3xl rounded-t-3xl p-6 border-t md:border border-white/10 shadow-2xl">
                {/* Drag handle for mobile */}
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4 md:hidden" />
                
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-black text-lg">Share Track</h3>
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setOpen(false)} 
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={18} />
                  </motion.button>
                </div>
                
                <p className="text-xs text-[var(--muted)] mb-5 line-clamp-2">{title}</p>
                
                <ShareContent 
                  copied={copied} 
                  copyLink={copyLink} 
                  shareUrl={shareUrl} 
                  shareToTwitter={shareToTwitter} 
                  shareToFacebook={shareToFacebook} 
                  shareToWhatsApp={shareToWhatsApp} 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
