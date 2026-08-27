"use client";

import * as React from "react";
import {
  IconBasket,
  IconHexagonNumber1,
  IconReportMoney,
  IconSettings,
  IconTruck,
  IconShoppingCartPlus,
} from "@tabler/icons-react";
import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboardIcon,
  ListIcon,
  CameraIcon,
  FileTextIcon,
  FileChartColumnIcon,
  FileIcon,
  CommandIcon,
} from "lucide-react";
import { ModeToggle } from "@/app/dashboard/mode-toggle";

const data = {
  user: {
    name: "admin",
    email: "admin@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Categories",
      url: "/dashboard/categories",
      icon: <ListIcon />,
    },
    {
      title: "Products",
      url: "/dashboard/products",
      icon: <IconBasket stroke={2} />,
    },
    {
      title: "Suppliers",
      url: "/dashboard/suppliers",
      icon: <IconTruck stroke={2} />,
    },
    {
      title: "Purchases",
      url: "/dashboard/purchases",
      icon: <IconShoppingCartPlus stroke={2} />,
    },
    {
      title: "Sales",
      url: "/dashboard/sales",
      icon: <IconReportMoney stroke={2} />,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: <CameraIcon />,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: <FileTextIcon />,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: <FileTextIcon />,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: <IconSettings stroke={2} />,
    },
  ],
  documents: [
    {
      name: "Today's Sales",
      url: "/dashboard/reports/todayssales",
      icon: <IconHexagonNumber1 />,
    },
    {
      name: "Weekly Sales",
      url: "/dashboard/reports/weeklysales",
      icon: <FileChartColumnIcon />,
    },
    {
      name: "Monthly Sales",
      url: "/dashboard/reports/monthlysales",
      icon: <FileIcon />,
    },
  ],
};
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <>
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="data-[slot=sidebar-menu-button]:p-1.5!"
                render={<a href="#" />}
              >
                <CommandIcon className="size-5!" />
                <span className="text-base font-semibold">ERP APP</span>
                <ModeToggle />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={data.navMain} />
          <NavDocuments items={data.documents} />
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
