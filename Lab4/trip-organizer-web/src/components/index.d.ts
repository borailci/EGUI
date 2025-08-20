import { FC, ReactNode } from 'react';

export interface ProtectedRouteProps {
    children: ReactNode;
}

export const ProtectedRoute: FC<ProtectedRouteProps>;
export const Navbar: FC; 