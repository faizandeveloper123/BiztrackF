import React from "react";

export interface SubMenuItem {
  text: string;
  icon: React.ElementType;
  path: string;
  roles: string[];
  planTypes: string[];
}

export interface MenuItem {
  text: string;
  icon: React.ElementType;
  path?: string;
  roles: string[];
  planTypes: string[];
  subItems?: SubMenuItem[];
  gradient: string;
}
