import React, { ReactNode } from 'react';
import { Navbar, BookingNavbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '../ui/Toast';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0D215B] text-white">
      <Navbar />
      <main>{children}</main>
      <ToastContainer />
    </div>
  );
}

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <ToastContainer />
    </div>
  );
}

export function BookingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F6F3] text-[#111111]">
      <BookingNavbar />
      <main>{children}</main>
      <ToastContainer />
    </div>
  );
}

export function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      <ToastContainer />
    </div>
  );
}
