'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useCart } from '@/components/CartContext';
import { Download, ShoppingCart, ArrowLeft, Package, AlertTriangle, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

export default function PropDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [prop, setProp] = useState(null);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [added, setAdded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    if (!id) return;
    fetch(`/api/props/${id}`)
      .then(r => r.json())
      .then(async data => {
        setProp(data);
        if (data.categoryId) {
          const cats = await fetch('/api/categories').then(r => r.json());
          setCategory((cats || []).find(c => c.id === data.categoryId));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleAdd = () => {
    addItem(prop);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const downloadImage = async (url, filename) => {
    try {
      const proxyUrl = `/api/download-image?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || 'prop-imagen.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  const downloadAllImages = async () => {
    if (!prop?.images?.length) return;
    setDownloading(true);
    for (let i = 0; i < prop.images.length; i++) {
      const img = prop.images[i];
      await downloadImage(img.url, `${prop.name}-${i + 1}.jpg`);
      if (i < prop.images.length - 1) await new Promise(r => setTimeout(r, 800));
    }
    setDownloading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ffc832]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="font-heading text-2xl font-black animate-pulse">Cargando...</div>
        </div>
      </div>
    );
  }

  if (!prop || prop.error) {
    return (
      <div className="min-h-screen bg-[#ffc832]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="font-heading text-4xl font-black mb-4">Prop no encontrado</h1>
          <Link href="/catalogo" className="btn-brutal inline-flex items-center gap-2">
            <ArrowLeft size={18} /> Volver al Catálogo
          </Link>
        </div>
      </div>
    );
  }

  const images = prop.images || [];
  const currentImg = images[currentImage];

  return (
    <div className="min-h-screen bg-[#ffc832]">
      <Navbar />

      {/* Breadcrumb */}
      <div className="border-b-4 border-black bg-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm font-bold">
          <Link href="/catalogo" className="flex items-center gap-1 hover:underline decoration-2">
            <ArrowLeft size={14} /> Catálogo
          </Link>
          {category && (
            <>
              <ChevronRight size={14} className="text-gray-400" />
              <span className="text-gray-500">{category.name}</span>
            </>
          )}
          <ChevronRight size={14} className="text-gray-400" />
          <span className="text-black">{prop.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-10">

          {/* IMAGES SECTION */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="card-brutal overflow-hidden relative">
              <div className="aspect-square bg-gray-100">
                {currentImg ? (
                  <img
                    src={currentImg.url}
                    alt={`${prop.name} - imagen ${currentImage + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#ffc832] flex items-center justify-center">
                    <Package size={60} />
                  </div>
                )}
              </div>
              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage(i => Math.max(0, i - 1))}
                    disabled={currentImage === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-[#ffc832] border-2 border-black p-2 shadow-brutal-xs disabled:opacity-30 hover:bg-black hover:text-[#ffc832] transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setCurrentImage(i => Math.min(images.length - 1, i + 1))}
                    disabled={currentImage === images.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#ffc832] border-2 border-black p-2 shadow-brutal-xs disabled:opacity-30 hover:bg-black hover:text-[#ffc832] transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
              {/* Image counter */}
              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black text-[#ffc832] text-xs font-black px-3 py-1 border-2 border-[#ffc832]">
                  {currentImage + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, i) => (
                  <button
                    key={img.id || i}
                    onClick={() => setCurrentImage(i)}
                    className={`aspect-square border-2 overflow-hidden transition-all ${i === currentImage ? 'border-black shadow-brutal-xs' : 'border-gray-300 opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img.url} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* DOWNLOAD IMAGES BUTTON — Critical Feature */}
            {images.length > 0 && (
              <button
                onClick={downloadAllImages}
                disabled={downloading}
                className="btn-brutal-outline w-full flex items-center justify-center gap-3 text-base"
              >
                <Download size={20} />
                {downloading ? 'Descargando imágenes...' : `Descargar ${images.length > 1 ? `${images.length} Imágenes` : 'Imagen'}`}
              </button>
            )}
            {images.length > 0 && (
              <p className="text-xs text-center text-gray-500">
                * Descarga las imágenes en alta resolución para usar en tus moodboards y presentaciones.
              </p>
            )}
          </div>

          {/* PROP INFO */}
          <div className="space-y-6">
            {/* Stock warning */}
            {prop.hasStockWarning && !prop.stockOverride && (
              <div className="bg-orange-100 border-4 border-orange-500 p-4 flex items-start gap-3">
                <AlertTriangle size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-orange-800 uppercase text-sm">Por confirmar stock</p>
                  <p className="text-orange-700 text-sm mt-1">Este prop puede estar rentado para las fechas seleccionadas. Puedes agregarlo al carrito y nuestro equipo confirmará disponibilidad.</p>
                </div>
              </div>
            )}

            {category && (
              <div className="inline-block bg-[#ffc832] border-2 border-black px-3 py-1 text-xs font-black uppercase">
                {category.name}
              </div>
            )}

            <h1 className="font-heading text-4xl font-black uppercase text-black leading-tight">{prop.name}</h1>

            {prop.dimensions && (
              <div className="card-brutal p-4">
                <p className="text-xs font-black uppercase text-gray-500 mb-1">Dimensiones</p>
                <p className="font-bold text-black">{prop.dimensions}</p>
              </div>
            )}

            {prop.description && (
              <div>
                <h3 className="font-heading font-black uppercase text-sm mb-2">Descripción</h3>
                <p className="text-gray-700 leading-relaxed">{prop.description}</p>
              </div>
            )}

            <hr className="border-t-4 border-black" />

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-heading text-5xl font-black text-black">
                ${prop.pricePerDay?.toLocaleString('es-MX')}
              </span>
              <span className="text-xl font-medium text-gray-500">/ día</span>
            </div>

            <p className="text-xs text-gray-500">El precio se calcula por día de renta. El total depende del período seleccionado.</p>

            {/* Add to cart */}
            <button
              onClick={handleAdd}
              className={`w-full flex items-center justify-center gap-3 text-lg py-4 border-4 border-black font-black uppercase shadow-brutal hover:shadow-brutal-xs hover:translate-x-[4px] hover:translate-y-[4px] transition-all ${added ? 'bg-green-500 text-white border-green-600' : 'bg-black text-[#ffc832]'}`}
            >
              {added ? (
                <>✓ Agregado al Carrito</>
              ) : (
                <><ShoppingCart size={22} /> Agregar al Carrito</>
              )}
            </button>

            <div className="flex gap-3">
              <Link href="/carrito" className="flex-1 btn-brutal-white flex items-center justify-center gap-2 text-sm">
                Ver Carrito
              </Link>
              <Link href="/catalogo" className="flex-1 btn-brutal-outline flex items-center justify-center gap-2 text-sm">
                <ArrowLeft size={16} /> Catálogo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

