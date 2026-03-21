'use client';
import { useEffect, useState, useCallback } from 'react';
import { Clock, CheckCircle, RotateCcw, FileText, ChevronDown, X, Download, Package, Calendar, User } from 'lucide-react';

const STATUSES = ['NEW', 'CONFIRMED', 'RETURNED'];
const STATUS_CONFIG = {
  NEW: { label: 'Nuevas', color: 'border-blue-400', headerBg: 'bg-blue-500', textColor: 'text-white', icon: <Clock size={16} />, badge: 'bg-blue-500 text-white' },
  CONFIRMED: { label: 'Confirmadas', color: 'border-green-400', headerBg: 'bg-green-500', textColor: 'text-white', icon: <CheckCircle size={16} />, badge: 'bg-green-500 text-white' },
  RETURNED: { label: 'Devueltas', color: 'border-gray-400', headerBg: 'bg-gray-600', textColor: 'text-white', icon: <RotateCcw size={16} />, badge: 'bg-gray-600 text-white' }
};

export default function CotizacionesPage() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [pdfGenerating, setPdfGenerating] = useState(null);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/quotes');
      const data = await res.json();
      setQuotes(Array.isArray(data) ? data : []);
    } catch (e) { setQuotes([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  const updateStatus = async (quoteId, newStatus) => {
    setUpdating(quoteId);
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const updated = await res.json();
      setQuotes(prev => prev.map(q => q.id === quoteId ? updated : q));
      if (selectedQuote?.id === quoteId) setSelectedQuote(updated);
    } catch (e) {} finally { setUpdating(null); }
  };

  const deleteQuote = async (quoteId) => {
    if (!confirm('¿Eliminar esta cotización?')) return;
    await fetch(`/api/quotes/${quoteId}`, { method: 'DELETE' });
    setSelectedQuote(null);
    fetchQuotes();
  };

  const generatePDF = async (quote) => {
    setPdfGenerating(quote.id);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = 210;
      const margin = 20;

      // Header background
      doc.setFillColor(255, 230, 0);
      doc.rect(0, 0, pageW, 35, 'F');

      // Logo / Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(0, 0, 0);
      doc.text('HANGAR', margin, 22);

      // Folio
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Folio: ${quote.folio}`, pageW - margin, 15, { align: 'right' });
      doc.text(`Fecha: ${new Date(quote.createdAt).toLocaleDateString('es-MX')}`, pageW - margin, 22, { align: 'right' });

      // Status badge
      const statusLabel = { NEW: 'NUEVA', CONFIRMED: 'CONFIRMADA', RETURNED: 'DEVUELTA' }[quote.status] || quote.status;
      doc.setFontSize(10);
      doc.text(`Estado: ${statusLabel}`, pageW - margin, 29, { align: 'right' });

      let y = 45;

      // Client section
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, pageW - margin * 2, 32, 'F');
      doc.setDrawColor(0);
      doc.rect(margin, y, pageW - margin * 2, 32);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('DATOS DEL CLIENTE', margin + 4, y + 7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`${quote.userName}`, margin + 4, y + 15);
      doc.text(`${quote.userEmail}`, margin + 4, y + 22);
      doc.text(`${quote.userPhone || '—'}`, margin + 4, y + 29);
      doc.text(`Empresa: ${quote.userProductionCompany || '—'}`, pageW / 2, y + 15);

      y += 40;

      // Dates section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('PERÍODO DE RENTA', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(
        `${new Date(quote.startDate).toLocaleDateString('es-MX')} — ${new Date(quote.endDate).toLocaleDateString('es-MX')}  (${quote.totalDays} días)`,
        margin, y + 7
      );

      y += 18;

      // Table header
      doc.setFillColor(0, 0, 0);
      doc.rect(margin, y, pageW - margin * 2, 9, 'F');
      doc.setTextColor(255, 230, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const colWidths = [65, 30, 25, 20, 30];
      const cols = ['PROP', 'DIMENSIONES', 'CANT.', 'DÍAS', '$/DÍA', 'SUBTOTAL'];
      let x = margin + 2;
      ['PROP', 'DIMENSIONES', 'CANT.', 'DÍAS', '$/DÍA', 'SUBTOTAL'].forEach((col, i) => {
        doc.text(col, x, y + 6);
        x += [60, 30, 18, 18, 22, 22][i];
      });

      y += 9;
      doc.setTextColor(0, 0, 0);

      // Table rows
      quote.items?.forEach((item, i) => {
        const rowH = 9;
        if (i % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, y, pageW - margin * 2, rowH, 'F');
        }
        doc.setDrawColor(200);
        doc.rect(margin, y, pageW - margin * 2, rowH);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        let cx = margin + 2;
        doc.text(String(item.propName || '').substring(0, 30), cx, y + 6); cx += 60;
        doc.text(String(item.propDimensions || '').substring(0, 18), cx, y + 6); cx += 30;
        doc.text(String(item.quantity || 1), cx, y + 6); cx += 18;
        doc.text(String(quote.totalDays), cx, y + 6); cx += 18;
        doc.text(`$${Number(item.pricePerDay).toLocaleString('es-MX')}`, cx, y + 6); cx += 22;
        doc.text(`$${Number(item.subtotal).toLocaleString('es-MX')}`, cx, y + 6);
        y += rowH;
      });

      y += 10;

      // Total
      doc.setFillColor(255, 230, 0);
      doc.rect(pageW - margin - 60, y, 60, 14, 'F');
      doc.setDrawColor(0);
      doc.rect(pageW - margin - 60, y, 60, 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text('TOTAL:', pageW - margin - 56, y + 9);
      doc.setFontSize(13);
      doc.text(`$${Number(quote.totalCost).toLocaleString('es-MX')}`, pageW - margin - 3, y + 9, { align: 'right' });

      // Notes
      if (quote.notes) {
        y += 22;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('NOTAS:', margin, y);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(quote.notes, pageW - margin * 2);
        doc.text(lines, margin, y + 6);
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text('HANGAR · Props para Producción Publicitaria · Perú', pageW / 2, 287, { align: 'center' });

      doc.save(`cotizacion-${quote.folio}.pdf`);
    } catch (e) {
      console.error('PDF error:', e);
      alert('Error al generar el PDF: ' + e.message);
    } finally {
      setPdfGenerating(null);
    }
  };

  const quotesByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = quotes.filter(q => q.status === s);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="font-heading text-5xl font-black uppercase mb-8">Cotizaciones</h1>
        <div className="grid lg:grid-cols-3 gap-6">
          {STATUSES.map(s => <div key={s} className="card-brutal h-64 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-heading text-5xl font-black uppercase text-black">Cotizaciones</h1>
        <p className="text-gray-700 font-medium">{quotes.length} cotizaciones totales</p>
      </div>

      {/* KANBAN BOARD */}
      <div className="grid lg:grid-cols-3 gap-6">
        {STATUSES.map(status => {
          const config = STATUS_CONFIG[status];
          const statusQuotes = quotesByStatus[status];
          return (
            <div key={status} className={`border-4 border-black shadow-brutal flex flex-col`}>
              {/* Column Header */}
              <div className={`${config.headerBg} border-b-4 border-black p-4 flex items-center justify-between`}>
                <div className="flex items-center gap-2 text-white">
                  {config.icon}
                  <h2 className="font-heading font-black uppercase">{config.label}</h2>
                </div>
                <span className="bg-black text-white text-xs font-black px-2 py-1">{statusQuotes.length}</span>
              </div>

              {/* Cards */}
              <div className="bg-[#ffc832] p-3 space-y-3 flex-1 min-h-[200px]">
                {statusQuotes.length === 0 ? (
                  <div className="border-2 border-dashed border-black p-6 text-center opacity-50">
                    <FileText size={24} className="mx-auto mb-2" />
                    <p className="text-xs font-bold uppercase">Sin cotizaciones</p>
                  </div>
                ) : statusQuotes.map(quote => (
                  <div
                    key={quote.id}
                    onClick={() => setSelectedQuote(quote)}
                    className="bg-white border-4 border-black shadow-brutal-xs hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all p-4 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-heading font-black text-lg">{quote.folio}</span>
                      {updating === quote.id && <span className="text-xs text-gray-500 animate-pulse">...</span>}
                    </div>
                    <p className="font-bold text-sm">{quote.userName}</p>
                    <p className="text-xs text-gray-500 mb-2">{quote.userProductionCompany}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Calendar size={12} />
                        {new Date(quote.startDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                      </span>
                      <span className="font-black">${quote.totalCost?.toLocaleString('es-MX')}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <Package size={12} /> {quote.items?.length} props · {quote.totalDays} días
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* QUOTE DETAIL PANEL */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-end">
          <div className="bg-white border-l-4 border-black w-full max-w-2xl h-full overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-[#ffc832] border-b-4 border-black p-5 flex items-center justify-between z-10">
              <div>
                <h2 className="font-heading font-black text-2xl">{selectedQuote.folio}</h2>
                <span className={`inline-flex items-center gap-1 text-xs font-black uppercase px-2 py-0.5 border border-black ${STATUS_CONFIG[selectedQuote.status]?.badge}`}>
                  {STATUS_CONFIG[selectedQuote.status]?.icon}
                  {STATUS_CONFIG[selectedQuote.status]?.label}
                </span>
              </div>
              <button onClick={() => setSelectedQuote(null)} className="p-2 hover:bg-black/10 border-2 border-black">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-6 flex-1">
              {/* Client Info */}
              <div className="card-brutal p-4">
                <h3 className="font-heading font-black uppercase text-sm mb-3 flex items-center gap-2"><User size={14} /> Cliente</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-xs text-gray-500">Nombre</p><p className="font-bold">{selectedQuote.userName}</p></div>
                  <div><p className="text-xs text-gray-500">Empresa</p><p className="font-bold">{selectedQuote.userProductionCompany || '—'}</p></div>
                  <div><p className="text-xs text-gray-500">Email</p><p className="font-bold text-xs">{selectedQuote.userEmail}</p></div>
                  <div><p className="text-xs text-gray-500">Teléfono</p><p className="font-bold">{selectedQuote.userPhone || '—'}</p></div>
                </div>
              </div>

              {/* Dates */}
              <div className="card-brutal p-4">
                <h3 className="font-heading font-black uppercase text-sm mb-3 flex items-center gap-2"><Calendar size={14} /> Período</h3>
                <div className="flex gap-6">
                  <div><p className="text-xs text-gray-500">Inicio</p><p className="font-bold">{new Date(selectedQuote.startDate).toLocaleDateString('es-MX')}</p></div>
                  <div><p className="text-xs text-gray-500">Fin</p><p className="font-bold">{new Date(selectedQuote.endDate).toLocaleDateString('es-MX')}</p></div>
                  <div><p className="text-xs text-gray-500">Días</p><p className="font-heading font-black text-2xl">{selectedQuote.totalDays}</p></div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-heading font-black uppercase text-sm mb-3 flex items-center gap-2"><Package size={14} /> Props ({selectedQuote.items?.length})</h3>
                <div className="border-4 border-black overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-black text-[#ffc832]">
                        <th className="text-left px-3 py-2 text-xs font-black uppercase">Prop</th>
                        <th className="text-center px-3 py-2 text-xs font-black uppercase">Cant.</th>
                        <th className="text-right px-3 py-2 text-xs font-black uppercase">$/Día</th>
                        <th className="text-right px-3 py-2 text-xs font-black uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedQuote.items?.map((item, i) => (
                        <tr key={i} className={`border-b border-gray-200 ${i % 2 ? 'bg-gray-50' : 'bg-white'}`}>
                          <td className="px-3 py-2">
                            <p className="font-bold">{item.propName}</p>
                            {item.propDimensions && <p className="text-xs text-gray-500">{item.propDimensions}</p>}
                          </td>
                          <td className="px-3 py-2 text-center font-bold">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">${item.pricePerDay?.toLocaleString('es-MX')}</td>
                          <td className="px-3 py-2 text-right font-black">${item.subtotal?.toLocaleString('es-MX')}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#ffc832] border-t-4 border-black">
                        <td colSpan={3} className="px-3 py-3 font-black uppercase">TOTAL</td>
                        <td className="px-3 py-3 text-right font-heading font-black text-xl">${selectedQuote.totalCost?.toLocaleString('es-MX')}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedQuote.notes && (
                <div className="card-brutal p-4">
                  <h3 className="font-heading font-black uppercase text-sm mb-2">Notas</h3>
                  <p className="text-sm text-gray-700">{selectedQuote.notes}</p>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="sticky bottom-0 bg-white border-t-4 border-black p-4 space-y-2">
              {/* Status transitions */}
              <div className="flex gap-2">
                {selectedQuote.status !== 'NEW' && (
                  <button onClick={() => updateStatus(selectedQuote.id, 'NEW')} disabled={updating === selectedQuote.id} className="flex-1 bg-blue-500 text-white border-4 border-black py-2 font-black uppercase text-xs hover:bg-blue-600 transition-colors">
                    ← Nueva
                  </button>
                )}
                {selectedQuote.status !== 'CONFIRMED' && (
                  <button onClick={() => updateStatus(selectedQuote.id, 'CONFIRMED')} disabled={updating === selectedQuote.id} className="flex-1 bg-green-500 text-white border-4 border-black py-2 font-black uppercase text-xs hover:bg-green-600 transition-colors">
                    Confirmar ✓
                  </button>
                )}
                {selectedQuote.status !== 'RETURNED' && (
                  <button onClick={() => updateStatus(selectedQuote.id, 'RETURNED')} disabled={updating === selectedQuote.id} className="flex-1 bg-gray-600 text-white border-4 border-black py-2 font-black uppercase text-xs hover:bg-gray-700 transition-colors">
                    Marcar Devuelta
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => generatePDF(selectedQuote)}
                  disabled={pdfGenerating === selectedQuote.id}
                  className="flex-1 btn-brutal-outline flex items-center justify-center gap-2 text-sm py-3"
                >
                  <Download size={16} />
                  {pdfGenerating === selectedQuote.id ? 'Generando PDF...' : 'Descargar PDF'}
                </button>
                <button
                  onClick={() => deleteQuote(selectedQuote.id)}
                  className="px-4 py-3 border-4 border-black bg-red-500 text-white font-bold uppercase text-xs hover:bg-red-600 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


