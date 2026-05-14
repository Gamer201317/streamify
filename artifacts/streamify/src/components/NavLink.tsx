import { Link, useLocation } from "wouter";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { AnchorHTMLAttributes } from "react";

interface NavLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
  activeClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ to, className, activeClassName, children, ...props }, ref) => {
    const [location] = useLocation();
    const isActive = location === to;

    return (
      <Link
        href={to}
        className={cn(className, isActive && activeClassName)}
        ref={ref}
        {...props}
      >
        {children}
      </Link>
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
