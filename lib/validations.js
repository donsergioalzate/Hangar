import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  phone: z.string().optional(),
  productionCompany: z.string().optional()
});

export const PropSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  dimensions: z.string().optional(),
  description: z.string().optional(),
  pricePerDay: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  categoryId: z.string().optional(),
  images: z.array(
    z.union([
      z.string(),
      z.object({
        id: z.string().optional(),
        url: z.string()
      })
    ])
  ).max(5, 'Máximo 5 imágenes por prop').optional(),
  stockOverride: z.boolean().optional()
});

export const CategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  slug: z.string().optional(),
  parentId: z.string().nullable().optional()
});

export const QuoteItemSchema = z.object({
  propId: z.string(),
  propName: z.string(),
  dimensions: z.string().optional(),
  pricePerDay: z.number(),
  quantity: z.number().min(1)
});

export const QuoteSchema = z.object({
  startDate: z.string().min(1, 'Fecha de inicio requerida'),
  endDate: z.string().min(1, 'Fecha de fin requerida'),
  notes: z.string().optional(),
  items: z.array(QuoteItemSchema).min(1, 'El carrito está vacío'),
  userName: z.string().optional(),
  userEmail: z.string().email('Email inválido').optional(),
  userPhone: z.string().optional(),
  userProductionCompany: z.string().optional(),
  userProjectName: z.string().optional()
});

export const HiddenEmailSchema = z.object({
  email: z.string().email('Email inválido'),
  department: z.string().min(1, 'El departamento es requerido')
});
