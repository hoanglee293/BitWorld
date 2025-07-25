"use client"
import { useLang } from "@/lang";
import React from "react";

interface ModalSigninProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalSignin({ isOpen, onClose }: ModalSigninProps) {
const { t } = useLang();
  if (!isOpen) return null;
  const handleGoogleSignIn = async () => {
    window.open(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI}&response_type=code&scope=email%20profile&access_type=offline`)
    console.log("handleGoogleSignIn")
  }

  const handlePhantomConnect = async () => {
    try {
      // Check if Phantom is installed
      const { solana } = window as any;
      if (!solana?.isPhantom) {
        window.open('https://phantom.app/', '_blank');
        return;
      }

      // Connect to Phantom
      const resp = await solana.connect();
      const publicKey = resp.publicKey.toString();
      
      // Store connection info in localStorage
      localStorage.setItem('phantomConnected', 'true');
      localStorage.setItem('phantomPublicKey', publicKey);
      
      // Close modal and reload page to update header
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Error connecting to Phantom:', error);
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 top-16 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50"
      onClick={handleOverlayClick}
    >
      <div className="py-5 px-8  bg-white mx-2 dark:bg-stone-950 rounded-lg shadow-[0px_0px_4px_0px_rgba(232,232,232,0.50)] dark:shadow-[0px_0px_4px_0px_rgba(0,0,0,0.50)] outline outline-1 outline-offset-[-1px] outline-theme-primary-500 backdrop-blur-[5px] inline-flex justify-start items-end gap-1">
        <div className="w-full inline-flex flex-col justify-start items-center gap-4">
          <div className="self-stretch inline-flex justify-between items-center">
            <div className="justify-start text-theme-primary-500 dark:text-theme-primary-500 text-lg font-semibold uppercase leading-relaxed">
              {t('header.wallet.connect')}
            </div>
          </div>
          <div className="flex flex-col justify-start items-center gap-1.5">
            <div className="justify-start text-gray-900 dark:text-white text-lg font-medium uppercase leading-relaxed">
              {t('header.wallet.welcome')}
            </div>
          </div>
          <div className="inline-flex justify-start items-center gap-4 md:gap-20 mb-4">
            <div
              data-property-1="Frame 427320434"
            >
              <button onClick={handleGoogleSignIn} className="text-center text-gray-900 h-12 min-w-44 bg-theme-primary-500 dark:text-white text-base font-normal leading-tight flex items-center gap-2 justify-center rounded-md">
                Login with <div className="w-10 h-10 overflow-hidden cursor-pointer rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800" onClick={handleGoogleSignIn}>
                  <img
                    src="https://img.icons8.com/color/48/google-logo.png"
                    alt="google" 
                    className="w-7 h-7 object-cover"
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
