import React from 'react';
import Layout from '../components/Layout';
import { Bell, Palette, ShieldCheck } from 'lucide-react';

const SettingsPage: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-lg text-gray-600">Manage preferences for notifications, appearance, and security.</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-gray-800">
              <Bell size={20} className="text-blue-600" /> Notifications
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4" defaultChecked />
                Campaign completion alerts
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4" defaultChecked />
                Lead submission summaries
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4" />
                Weekly performance digest
              </label>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-gray-800">
              <Palette size={20} className="text-purple-600" /> Appearance
            </h3>
            <div className="text-sm text-gray-600 space-y-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4" />
                Compact sidebar
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4" defaultChecked />
                Show onboarding tips
              </label>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-gray-800">
              <ShieldCheck size={20} className="text-emerald-600" /> Security
            </h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>Two-factor authentication is coming soon.</p>
              <button className="mt-2 px-4 py-2 text-sm font-semibold text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-50">
                Reset sessions
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
