import { motion } from "framer-motion";

const WHATSAPP_SUPPORT_URL = "https://wa.me/212693783800";

export function WhatsAppSupportButton() {
  return (
    <div className="group fixed bottom-4 right-4 z-[80] sm:bottom-5 sm:right-5 md:bottom-6 md:right-6 lg:bottom-7 lg:right-7">
      <div
        className="pointer-events-none absolute bottom-1/2 right-[calc(100%+0.75rem)] hidden translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-[#25D366]/35 bg-background/90 px-3 py-2 text-xs font-semibold text-foreground opacity-0 shadow-[0_14px_34px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-all duration-200 group-hover:flex group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:flex group-focus-within:translate-x-0 group-focus-within:opacity-100 sm:right-[calc(100%+0.9rem)]"
        aria-hidden="true"
      >
        <span className="h-2 w-2 rounded-full bg-[#25D366] shadow-[0_0_14px_rgba(37,211,102,0.75)]" />
        WhatsApp support
      </div>

      <motion.a
        href={WHATSAPP_SUPPORT_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with ZacTrades support on WhatsApp"
        className="relative grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_14px_34px_rgba(37,211,102,0.35)] ring-4 ring-[#25D366]/15 transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#25D366]/45 sm:h-14 sm:w-14 md:h-16 md:w-16"
        initial={{ opacity: 0, scale: 0.82, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.96 }}
      >
        <span
          className="absolute inset-0 rounded-full bg-[#25D366] opacity-35 blur-xl"
          aria-hidden="true"
        />
        <svg
          viewBox="0 0 32 32"
          aria-hidden="true"
          className="relative h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9"
          fill="currentColor"
        >
          <path d="M16.02 3.2C9 3.2 3.28 8.84 3.28 15.78c0 2.22.59 4.38 1.7 6.28L3.2 28.8l6.92-1.8a12.88 12.88 0 0 0 5.9 1.48c7.03 0 12.75-5.64 12.75-12.58S23.05 3.2 16.02 3.2Zm0 23.15c-1.93 0-3.82-.53-5.46-1.54l-.39-.24-4.1 1.07 1.09-3.96-.26-.41a10.23 10.23 0 0 1-1.57-5.49c0-5.77 4.76-10.46 10.61-10.46s10.62 4.69 10.62 10.46-4.76 10.57-10.54 10.57Zm5.82-7.84c-.32-.16-1.89-.92-2.18-1.03-.29-.11-.5-.16-.72.16-.21.32-.82 1.03-1.01 1.24-.19.21-.37.24-.69.08-.32-.16-1.35-.49-2.57-1.56-.95-.84-1.59-1.88-1.78-2.2-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.72-.98-2.36-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.08-1.11 2.64s1.14 3.07 1.3 3.28c.16.21 2.25 3.4 5.44 4.77.76.33 1.35.52 1.81.67.76.24 1.46.21 2.01.13.61-.09 1.89-.76 2.16-1.5.27-.74.27-1.37.19-1.5-.08-.13-.29-.21-.61-.37Z" />
        </svg>
      </motion.a>
    </div>
  );
}
