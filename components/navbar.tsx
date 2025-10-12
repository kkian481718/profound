"use client";

import { useEffect, useState } from "react";
import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Link } from "@heroui/link";
import { link as linkStyles } from "@heroui/theme";
import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { Logo } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";

export const Navbar = () => {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // 檢查當前用戶狀態
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // 監聽認證狀態變化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();

    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo />
            <p className="font-bold text-inherit">Profound</p>
          </NextLink>
        </NavbarBrand>
        <ul className="hidden lg:flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <NextLink
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium",
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarItem>
          ))}
        </ul>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          <ThemeSwitch />
        </NavbarItem>
        {user ? (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button color="primary" variant="flat">
                管理選單
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Admin Menu">
              <>
                {siteConfig.adminNavItems.map((item) => (
                  <DropdownItem
                    key={item.href}
                    onPress={() => router.push(item.href)}
                  >
                    {item.label}
                  </DropdownItem>
                ))}
                <DropdownItem
                  key="logout"
                  color="danger"
                  onPress={handleLogout}
                >
                  登出
                </DropdownItem>
              </>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <NavbarItem>
            <Button as={NextLink} color="primary" href="/login" variant="flat">
              管理員登入
            </Button>
          </NavbarItem>
        )}
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {siteConfig.navItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <Link color={"foreground"} href={item.href} size="lg">
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
          {user && (
            <>
              <div className="my-2 border-t border-divider" />
              {siteConfig.adminNavItems.map((item, index) => (
                <NavbarMenuItem key={`admin-${item}-${index}`}>
                  <Link color={"primary"} href={item.href} size="lg">
                    {item.label}
                  </Link>
                </NavbarMenuItem>
              ))}
              <NavbarMenuItem>
                <Button
                  className="w-full"
                  color="danger"
                  variant="flat"
                  onPress={handleLogout}
                >
                  登出
                </Button>
              </NavbarMenuItem>
            </>
          )}
          {!user && (
            <>
              <div className="my-2 border-t border-divider" />
              <NavbarMenuItem>
                <Button
                  as={NextLink}
                  className="w-full"
                  color="primary"
                  href="/login"
                  variant="flat"
                >
                  管理員登入
                </Button>
              </NavbarMenuItem>
            </>
          )}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
