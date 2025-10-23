import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  sanitizeUsername,
  sanitizeText,
  isValidEmail,
  isStrongPassword,
  checkRateLimit,
} from '@/lib/security';

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  password: z.string().min(8),
  name: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    // Rate limiting por IP: máximo 5 registros por hora
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `register_${ip}`;
    const rateLimit = checkRateLimit(rateLimitKey, 5, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos de registro. Intenta más tarde.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, username, password, name } = registerSchema.parse(body);

    // Validación adicional de seguridad
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    if (!isStrongPassword(password)) {
      return NextResponse.json(
        {
          error:
            'Contraseña débil. Debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
        },
        { status: 400 }
      );
    }

    // Sanitizar inputs
    const sanitizedUsername = sanitizeUsername(username);
    const sanitizedName = name ? sanitizeText(name) : undefined;

    // Validar que username solo contenga caracteres permitidos
    if (sanitizedUsername !== username) {
      return NextResponse.json(
        { error: 'El nombre de usuario solo puede contener letras, números y guiones bajos' },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 400 }
      );
    }

    // Verificar si el username ya existe
    const existingUsername = await prisma.user.findUnique({
      where: { username: sanitizedUsername },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Este nombre de usuario ya está en uso' },
        { status: 400 }
      );
    }

    // Hash de la contraseña con rounds aumentado para más seguridad
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        username: sanitizedUsername,
        password: hashedPassword,
        name: sanitizedName,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { message: 'Usuario creado exitosamente', user },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    // Log error on server-side only
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}
