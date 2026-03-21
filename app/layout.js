import './globals.css';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'HANGAR — Catálogo de Props',
  description: 'Catálogo especializado de renta de props para producciones publicitarias',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <script dangerouslySetInnerHTML={{__html: 'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body>
        <Providers>
          {children}
          <a
            href="https://wa.me/51913186082?text=Necesito ayuda con una cotización por favor"
            className="whatsapp-float"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
          >
            <span className="whatsapp-float__icon" aria-hidden="true">
              <svg viewBox="0 0 32 32" role="img" focusable="false">
                <path d="M19.11 17.43c-.26-.13-1.52-.75-1.76-.84-.24-.09-.41-.13-.58.13-.17.26-.67.84-.82 1.01-.15.17-.3.2-.56.07-.26-.13-1.08-.4-2.05-1.27-.76-.68-1.28-1.52-1.43-1.78-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.58-1.4-.8-1.92-.21-.5-.42-.43-.58-.44-.15-.01-.32-.01-.49-.01-.17 0-.45.07-.69.32-.24.26-.91.89-.91 2.17 0 1.27.93 2.5 1.06 2.67.13.17 1.83 2.8 4.43 3.92.62.27 1.1.44 1.47.56.62.2 1.18.17 1.63.1.5-.08 1.52-.62 1.73-1.22.21-.6.21-1.12.15-1.22-.06-.11-.22-.17-.48-.3z" />
                <path d="M16 3C9.37 3 4 8.37 4 15c0 2.34.67 4.52 1.83 6.36L4 29l7.85-1.8A11.9 11.9 0 0 0 16 27c6.63 0 12-5.37 12-12S22.63 3 16 3zm0 21.6c-1.82 0-3.51-.5-4.95-1.37l-.35-.21-4.66 1.07 1-4.54-.23-.37A9.55 9.55 0 1 1 16 24.6z" />
              </svg>
            </span>
          </a>
        </Providers>
      </body>
    </html>
  );
}
