'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('hangar_cart');
      if (saved) {
        const data = JSON.parse(saved);
        setItems(data.items || []);
        setStartDate(data.startDate || '');
        setEndDate(data.endDate || '');
      }
    } catch (e) {}
    setInitialized(true);
  }, []);

  const saveToStorage = (newItems, newStart, newEnd) => {
    try {
      localStorage.setItem('hangar_cart', JSON.stringify({ items: newItems, startDate: newStart, endDate: newEnd }));
    } catch (e) {}
  };

  const addItem = (prop) => {
    setItems(prev => {
      const existing = prev.find(i => i.propId === prop.id);
      const newItems = existing
        ? prev.map(i => i.propId === prop.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { propId: prop.id, propName: prop.name, pricePerDay: prop.pricePerDay, dimensions: prop.dimensions || '', imageUrl: prop.images?.[0]?.url || '', quantity: 1 }];
      saveToStorage(newItems, startDate, endDate);
      return newItems;
    });
  };

  const removeItem = (propId) => {
    setItems(prev => {
      const newItems = prev.filter(i => i.propId !== propId);
      saveToStorage(newItems, startDate, endDate);
      return newItems;
    });
  };

  const updateQuantity = (propId, quantity) => {
    if (quantity <= 0) { removeItem(propId); return; }
    setItems(prev => {
      const newItems = prev.map(i => i.propId === propId ? { ...i, quantity } : i);
      saveToStorage(newItems, startDate, endDate);
      return newItems;
    });
  };

  const updateDates = (start, end) => {
    setStartDate(start);
    setEndDate(end);
    saveToStorage(items, start, end);
  };

  const clearCart = () => {
    setItems([]);
    setStartDate('');
    setEndDate('');
    try { localStorage.removeItem('hangar_cart'); } catch (e) {}
  };

  const totalDays = startDate && endDate
    ? Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1)
    : 1;

  const totalCost = items.reduce((sum, item) => sum + item.pricePerDay * item.quantity * totalDays, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, startDate, endDate, totalDays, totalCost, itemCount, addItem, removeItem, updateQuantity, updateDates, clearCart, initialized }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart debe usarse dentro de CartProvider');
  return context;
}
