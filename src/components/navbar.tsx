'use client';

import { memo } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
} from '@nextui-org/react';
import { FiMusic, FiHome, FiStar, FiUser, FiLogOut } from 'react-icons/fi';

function NavBar() {
  const { data: session, status } = useSession();

  return (
    <Navbar isBordered maxWidth="xl">
      <NavbarBrand>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 rounded-md flex items-center justify-center">
            <span className="text-white font-black text-sm">E</span>
          </div>
          <p className="font-black text-xl bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 bg-clip-text text-transparent">
            ECHO
          </p>
        </Link>
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem>
          <Link href="/" className="flex items-center gap-1">
            <FiHome /> Inicio
          </Link>
        </NavbarItem>
        {status === 'authenticated' && (
          <>
            <NavbarItem>
              <Link href="/shows" className="flex items-center gap-1">
                <FiMusic /> Shows
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link href="/users" className="flex items-center gap-1">
                <FiUser /> Usuarios
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link href="/para-ti" className="flex items-center gap-1">
                <FiStar /> Para ti
              </Link>
            </NavbarItem>
          </>
        )}
      </NavbarContent>

      <NavbarContent justify="end">
        {status === 'authenticated' && session?.user ? (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                isBordered
                as="button"
                className="transition-transform"
                color="primary"
                name={session.user.name || session.user.email || ''}
                size="sm"
                src={session.user.image || ''}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-semibold">Sesión iniciada como</p>
                <p className="font-semibold">{session.user.email}</p>
              </DropdownItem>
              <DropdownItem
                key="user_profile"
                startContent={<FiUser />}
                as={Link}
                href={`/perfil/${(session.user as any).username}`}
              >
                Mi Perfil
              </DropdownItem>
              <DropdownItem
                key="logout"
                color="danger"
                startContent={<FiLogOut />}
                onClick={() => signOut()}
              >
                Cerrar Sesión
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <>
            <NavbarItem>
              <Button as={Link} color="primary" href="/auth/login" variant="flat">
                Iniciar Sesión
              </Button>
            </NavbarItem>
            <NavbarItem>
              <Button as={Link} color="primary" href="/auth/register" variant="solid">
                Registrarse
              </Button>
            </NavbarItem>
          </>
        )}
      </NavbarContent>
    </Navbar>
  );
}

export default memo(NavBar);
