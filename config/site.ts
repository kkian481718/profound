export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Profound | 花蓮志學外送平台",
  description:
    "花蓮市區 <-> 志學的共享順路外送平台：餐點（肯德基、麥當勞、必勝客）與全聯代購，即時媒合、鄰里互助，讓每一趟路都更有價值。",
  navItems: [
    {
      label: "訂購！",
      href: "/",
    },
    {
      label: "查詢訂單",
      href: "/orders/lookup",
    },
    {
      label: "常見問題",
      href: "/faq",
    },
  ],
  adminNavItems: [
    {
      label: "店家管理",
      href: "/admin/stores",
    },
    {
      label: "訂單管理",
      href: "/admin/orders",
    },
    {
      label: "利潤查詢",
      href: "/admin/profit",
    },
  ],
  links: {
    line: "https://line.me/ti/g2/doSJzEdtzFR3oAV6YoZPhoZR8mubtUVPf9tWmQ",
  },
};
